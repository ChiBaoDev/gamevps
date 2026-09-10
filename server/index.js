import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { validateAndLoginKey, getUserByToken, activeSessions, tokenToSession } from './keyManager.js';
import { registerAdminRoutes } from './adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

// Middleware xử lý JSON và CORS gọn nhẹ
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

/**
 * Hàm gửi tin nhắn tới toàn bộ người chơi đang kết nối
 */
export function broadcastGlobalMessage(payload) {
  const data = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// 1. API Xác Thực Bằng Key
app.post('/api/auth/login-key', (req, res) => {
  const { keyCode } = req.body;
  const result = validateAndLoginKey(keyCode);
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// 2. API Lấy thông tin tài khoản hiện tại từ Token
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;
  if (!token) return res.status(401).json({ success: false, error: 'Thiếu Token' });

  const user = getUserByToken(token);
  if (!user) return res.status(401).json({ success: false, error: 'Phiên đăng nhập hết hạn.' });

  return res.json({ success: true, user });
});

// 3. Health Check & RAM Monitor
app.get('/api/health', (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    activeConnections: wss.clients.size,
    ramMb: {
      rss: (memory.rss / 1024 / 1024).toFixed(2),
      heapUsed: (memory.heapUsed / 1024 / 1024).toFixed(2),
      heapTotal: (memory.heapTotal / 1024 / 1024).toFixed(2),
    }
  });
});

// 4. Đăng ký Admin Routes
registerAdminRoutes(app, broadcastGlobalMessage);

// 5. Phục vụ Web tĩnh (Dist) nếu đã build
const DIST_DIR = path.resolve(__dirname, '../dist');
if (fs.existsSync(DIST_DIR)) {
  console.log(`[HTTP] Phục vụ giao diện web tĩnh từ: ${DIST_DIR}`);
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
  });
}

// 6. Xử lý WebSocket Realtime Handshake & Heartbeat
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  let sessionUser = null;
  if (token) {
    sessionUser = getUserByToken(token);
    if (sessionUser && activeSessions.has(sessionUser.keyCode)) {
      const session = activeSessions.get(sessionUser.keyCode);
      session.socket = ws;
      session.lastSeen = Date.now();
    }
  }

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  // Gửi thông báo chào mừng & kết nối thành công
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    message: 'Kết nối máy chủ game thành công!',
    user: sessionUser,
  }));

  // Xử lý tin nhắn từ Client
  ws.on('message', (messageRaw) => {
    try {
      const msg = JSON.parse(messageRaw);

      if (msg.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
        return;
      }

      if (msg.type === 'AUTH') {
        const user = getUserByToken(msg.token);
        if (user) {
          sessionUser = user;
          if (activeSessions.has(user.keyCode)) {
            activeSessions.get(user.keyCode).socket = ws;
          }
          ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', user }));
        } else {
          ws.send(JSON.stringify({ type: 'AUTH_FAILED', error: 'Token không hợp lệ.' }));
        }
        return;
      }

      // Xử lý chat công viên
      if (msg.type === 'CHAT_MESSAGE') {
        if (!sessionUser) return;
        broadcastGlobalMessage({
          type: 'CHAT_BROADCAST',
          id: Date.now().toString(),
          senderName: sessionUser.nickname,
          text: msg.text,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    } catch (e) {
      console.error('[WS] Lỗi xử lý tin nhắn:', e);
    }
  });

  ws.on('close', () => {
    if (sessionUser && activeSessions.has(sessionUser.keyCode)) {
      const session = activeSessions.get(sessionUser.keyCode);
      if (session.socket === ws) {
        // Giữ phiên trong 60s để cho phép reconnect trước khi giải phóng RAM
        session.socket = null;
      }
    }
  });
});

// Heartbeat 25s dọn dẹp các kết nối đứt mạng (Tránh rò rỉ RAM)
const heartbeatInterval = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 25000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// Giám sát RAM định kỳ (in ra terminal mỗi 30s)
setInterval(() => {
  const m = process.memoryUsage();
  console.log(`[RAM MONITOR] RSS: ${(m.rss/1024/1024).toFixed(1)}MB | Heap: ${(m.heapUsed/1024/1024).toFixed(1)}/${(m.heapTotal/1024/1024).toFixed(1)}MB | Online: ${activeSessions.size} CCU`);
}, 30000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 GAME SERVER ĐÃ SẴN SÀNG TẠI CỔNG: http://0.0.0.0:${PORT}`);
  console.log(`📡 WebSocket URL: ws://0.0.0.0:${PORT}/ws`);
  console.log(`🛡️ Master Admin Key: KEY-ADMIN-ROOT-9999`);
  console.log(`🎮 Test Player Keys: KEY-VIP-8888, KEY-TEST-0001, KEY-TEST-0002`);
  console.log(`=======================================================`);
});
