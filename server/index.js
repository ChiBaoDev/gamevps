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
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, error: 'Dữ liệu JSON không hợp lệ.' });
  }
  next();
});
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

// ==========================================
// GAME ACTION REST APIS (SERVER-AUTHORITATIVE)
// ==========================================

import { 
  handleBuyShopItem, 
  handleSellInventoryItem, 
  handlePlantCrop, 
  handleHarvestCrop, 
  handleCatchFish, 
  handleBuyHouse, 
  handleBuyVehicle,
  handleBuyAnimal,
  handleFeedAnimal,
  handleCollectAnimalProduct,
  ALL_CROPS,
  ALL_FISH,
  ALL_HOUSES,
  ALL_VEHICLES,
  ALL_CONSUMABLES
} from './gameEconomy.js';
import { claimQuestReward } from './questEngine.js';
import { listMarketplaceItem, buyMarketplaceItem, getActiveMarketplaceListings } from './tradeEngine.js';
import { bauCuaRoom } from './bauCuaEngine.js';

// Khởi tạo Bầu Cua Room realtime broadcast
bauCuaRoom.setBroadcastCallback(broadcastGlobalMessage);
bauCuaRoom.startLoop();

// Middleware xác thực token người chơi
function requireUser(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (req.body && req.body.token) || req.query.token;
  if (!token) return res.status(401).json({ success: false, error: 'Thiếu mã xác thực (Token).' });
  const user = getUserByToken(token);
  if (!user) return res.status(401).json({ success: false, error: 'Phiên đăng nhập không hợp lệ.' });
  req.user = user;
  next();
}

// Mua đồ từ Shop
app.post('/api/game/buy-item', requireUser, (req, res) => {
  const { itemId, count = 1 } = req.body;
  const result = handleBuyShopItem(req.user.id, itemId, Number(count));
  res.json(result);
});

// Bán đồ cho Thương Lái
app.post('/api/game/sell-item', requireUser, (req, res) => {
  const { itemId, count = 1 } = req.body;
  const result = handleSellInventoryItem(req.user.id, itemId, Number(count));
  res.json(result);
});

// Gieo hạt giống
app.post('/api/game/plant', requireUser, (req, res) => {
  const { plotId, cropId } = req.body;
  const result = handlePlantCrop(req.user.id, Number(plotId), cropId);
  res.json(result);
});

// Thu hoạch nông sản
app.post('/api/game/harvest', requireUser, (req, res) => {
  const { plotId } = req.body;
  const result = handleHarvestCrop(req.user.id, Number(plotId));
  res.json(result);
});

// Câu cá
app.post('/api/game/fish', requireUser, (req, res) => {
  const { rodId, baitId } = req.body;
  const result = handleCatchFish(req.user.id, rodId, baitId);
  res.json(result);
});

// Mua & Nâng cấp Nhà ở
app.post('/api/game/buy-house', requireUser, (req, res) => {
  const { houseId } = req.body;
  const result = handleBuyHouse(req.user.id, houseId);
  res.json(result);
});

// Mua Xe cộ / Thú cưỡi
app.post('/api/game/buy-vehicle', requireUser, (req, res) => {
  const { vehicleId } = req.body;
  const result = handleBuyVehicle(req.user.id, vehicleId);
  res.json(result);
});

// Chăn Nuôi: Mua Gà con, Heo con
app.post('/api/game/animals/buy', requireUser, (req, res) => {
  const { animalType } = req.body;
  const result = handleBuyAnimal(req.user.id, animalType);
  res.json(result);
});

// Chăn Nuôi: Cho vật nuôi ăn
app.post('/api/game/animals/feed', requireUser, (req, res) => {
  const { animalType, animalId } = req.body;
  const result = handleFeedAnimal(req.user.id, animalType, Number(animalId));
  res.json(result);
});

// Chăn Nuôi: Thu hoạch sản phẩm (trứng, thịt)
app.post('/api/game/animals/collect', requireUser, (req, res) => {
  const { animalType, animalId } = req.body;
  const result = handleCollectAnimalProduct(req.user.id, animalType, Number(animalId));
  res.json(result);
});

// Nhận thưởng nhiệm vụ
app.post('/api/game/claim-quest', requireUser, (req, res) => {
  const { questId } = req.body;
  const result = claimQuestReward(req.user.id, questId);
  res.json(result);
});

// Chợ Đêm: Lấy danh sách hàng bán
app.get('/api/game/market', (req, res) => {
  const listings = getActiveMarketplaceListings(50);
  res.json({ success: true, listings });
});

// Chợ Đêm: Treo bán món đồ
app.post('/api/game/market/list', requireUser, (req, res) => {
  const { itemId, count = 1, priceXu = 100 } = req.body;
  const result = listMarketplaceItem(req.user.id, itemId, Number(count), Number(priceXu));
  res.json(result);
});

// Chợ Đêm: Mua món đồ
app.post('/api/game/market/buy', requireUser, (req, res) => {
  const { listingId } = req.body;
  const result = buyMarketplaceItem(req.user.id, Number(listingId));
  res.json(result);
});

// Bầu Cua: Lấy state hiện tại
app.get('/api/game/baucua/state', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;
  const user = token ? getUserByToken(token) : null;
  res.json({ success: true, ...bauCuaRoom.getStateForClient(user ? user.id : null) });
});

// ==========================================
// REALTIME CÔNG VIÊN (PARK PLAZA) MULTIPLAYER
// ==========================================
const parkPlayers = new Map(); // userId -> { id, nickname, level, role, appearance, vehicleId, x, y, direction, isMoving, lastChat }

// REST endpoint lấy danh sách người chơi trong công viên
app.get('/api/game/park/players', (req, res) => {
  res.json({ success: true, players: Array.from(parkPlayers.values()) });
});

// Xử lý ném xu cầu may đài phun nước qua REST
app.post('/api/game/park/wish', requireUser, (req, res) => {
  if (req.user.xu < 10) return res.status(400).json({ success: false, error: 'Bạn cần ít nhất 10 Xu để ném xu ước nguyện!' });
  updateUserBalance(req.user.id, -10, 0);

  const roll = Math.random() * 100;
  let rewardText = '';
  if (roll < 40) {
    rewardText = 'Nhận được +10 EXP may mắn từ Thần Nước!';
    saveUserProfile(req.user.id, { exp: req.user.exp + 10 });
  } else if (roll < 75) {
    rewardText = 'Thần Nước trả lại 50 Xu tài lộc!';
    updateUserBalance(req.user.id, 50, 0);
  } else if (roll < 95) {
    rewardText = '🎉 Đại Cát! Nhận được 1 LƯỢNG từ giếng ước!';
    updateUserBalance(req.user.id, 0, 1);
  } else {
    rewardText = '🌟 ĐẠI PHÚC ĐẠI QUÝ! Trúng 300 Xu từ Thần Long!';
    updateUserBalance(req.user.id, 300, 0);
  }

  broadcastGlobalMessage({
    type: 'PARK_WISH_BROADCAST',
    senderName: req.user.nickname,
    prizeText: rewardText,
  });

  res.json({ success: true, user: getUserById(req.user.id), message: rewardText });
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

      // Xử lý cược Bầu Cua qua WS
      if (msg.type === 'BAUCUA_BET') {
        if (!sessionUser) {
          ws.send(JSON.stringify({ type: 'BAUCUA_BET_ERROR', error: 'Vui lòng đăng nhập trước khi cược!' }));
          return;
        }
        const result = bauCuaRoom.placeBet(sessionUser.id, msg.mascot, Number(msg.amount));
        if (result.success) {
          ws.send(JSON.stringify({ type: 'BAUCUA_BET_SUCCESS', ...result }));
        } else {
          ws.send(JSON.stringify({ type: 'BAUCUA_BET_ERROR', error: result.error }));
        }
        return;
      }

      // Xử lý lấy state Bầu Cua qua WS
      if (msg.type === 'BAUCUA_GET_STATE') {
        const state = bauCuaRoom.getStateForClient(sessionUser ? sessionUser.id : null);
        ws.send(JSON.stringify(state));
        return;
      }

      // ==========================================
      // XỬ LÝ CÔNG VIÊN (PARK REALTIME MULTIPLAYER)
      // ==========================================
      if (msg.type === 'PARK_JOIN') {
        if (!sessionUser) return;
        const playerObj = {
          id: sessionUser.id,
          nickname: sessionUser.nickname,
          level: sessionUser.level,
          role: sessionUser.role,
          gender: sessionUser.gender,
          appearance: sessionUser.appearance,
          vehicleId: sessionUser.equippedVehicleId || '',
          equippedHouseId: sessionUser.equippedHouseId || 'house_leaf',
          houses: sessionUser.houses || ['house_leaf'],
          xu: sessionUser.xu || 0,
          luong: sessionUser.luong || 0,
          stats: sessionUser.stats || {},
          x: msg.x || (200 + Math.floor(Math.random() * 400)),
          y: msg.y || (150 + Math.floor(Math.random() * 200)),
          direction: 'right',
          isMoving: false,
          speechBubble: null,
          lastSeen: Date.now(),
        };

        parkPlayers.set(sessionUser.id, playerObj);

        // Gửi toàn bộ danh sách cho người vừa vào
        ws.send(JSON.stringify({
          type: 'PARK_SYNC_ALL',
          players: Array.from(parkPlayers.values()),
        }));

        // Báo cho những người khác biết
        broadcastGlobalMessage({
          type: 'PARK_PLAYER_JOINED',
          player: playerObj,
        });
        return;
      }

      if (msg.type === 'PARK_MOVE') {
        if (!sessionUser) return;
        const player = parkPlayers.get(sessionUser.id);
        if (player) {
          player.x = msg.x;
          player.y = msg.y;
          player.direction = msg.direction || 'right';
          player.isMoving = !!msg.isMoving;
          player.lastSeen = Date.now();

          // Broadcast vị trí mới cho tất cả
          broadcastGlobalMessage({
            type: 'PARK_PLAYER_MOVED',
            userId: sessionUser.id,
            x: player.x,
            y: player.y,
            direction: player.direction,
            isMoving: player.isMoving,
          });
        }
        return;
      }

      if (msg.type === 'PARK_CHAT') {
        if (!sessionUser || !msg.text) return;
        const player = parkPlayers.get(sessionUser.id);
        if (player) {
          player.speechBubble = msg.text;
        }

        broadcastGlobalMessage({
          type: 'PARK_CHAT_BROADCAST',
          id: Date.now().toString(),
          senderId: sessionUser.id,
          senderName: sessionUser.nickname,
          text: msg.text,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        });
        return;
      }

      if (msg.type === 'PARK_EMOTE') {
        if (!sessionUser) return;
        broadcastGlobalMessage({
          type: 'PARK_EMOTE_BROADCAST',
          senderId: sessionUser.id,
          senderName: sessionUser.nickname,
          emote: msg.emote || 'heart',
        });
        return;
      }

      if (msg.type === 'PARK_LEAVE') {
        if (sessionUser && parkPlayers.has(sessionUser.id)) {
          parkPlayers.delete(sessionUser.id);
          broadcastGlobalMessage({
            type: 'PARK_PLAYER_LEFT',
            userId: sessionUser.id,
          });
        }
        return;
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
