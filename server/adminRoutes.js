import { 
  adminGetAllKeys, 
  adminCreateKeys, 
  adminToggleKey, 
  adminGetAllUsers, 
  adminUpdateUser, 
  adminKickUser, 
  adminGiftItem,
  activeSessions,
  getUserByToken
} from './keyManager.js';
import { db } from './db.js';

/**
 * Middleware kiểm tra quyền Quản trị viên (Admin Guard)
 */
export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Thiếu mã xác thực (Token).' });
  }

  const user = getUserByToken(token);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Bạn không có quyền Quản trị viên (Admin).' });
  }

  req.adminUser = user;
  next();
}

/**
 * Đăng ký các API Quản Trị Hệ Thống
 */
export function registerAdminRoutes(app, broadcastGlobalMessage) {
  // 1. Thống kê Server & Đo RAM thực tế
  app.get('/api/admin/stats', requireAdmin, (req, res) => {
    const memory = process.memoryUsage();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const keyCount = db.prepare('SELECT COUNT(*) as count FROM access_keys').get().count;
    const baucuaRounds = db.prepare('SELECT COUNT(*) as count FROM baucua_rounds').get().count;

    res.json({
      success: true,
      stats: {
        ram: {
          rssMb: (memory.rss / 1024 / 1024).toFixed(2),
          heapUsedMb: (memory.heapUsed / 1024 / 1024).toFixed(2),
          heapTotalMb: (memory.heapTotal / 1024 / 1024).toFixed(2),
          externalMb: (memory.external / 1024 / 1024).toFixed(2),
        },
        onlineCount: activeSessions.size,
        totalUsers: userCount,
        totalKeys: keyCount,
        totalBaucuaRounds: baucuaRounds,
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
      }
    });
  });

  // 2. Lấy danh sách Key
  app.get('/api/admin/keys', requireAdmin, (req, res) => {
    const keys = adminGetAllKeys(100);
    res.json({ success: true, keys });
  });

  // 3. Tạo Key mới
  app.post('/api/admin/keys/create', requireAdmin, (req, res) => {
    const { count, prefix, role, xu, luong, assignedName, note } = req.body;
    const createdKeys = adminCreateKeys({
      count: Number(count) || 1,
      prefix: prefix || 'KEY',
      role: role || 'player',
      xu: Number(xu) || 50000,
      luong: Number(luong) || 20,
      assignedName,
      note
    });

    res.json({ success: true, count: createdKeys.length, createdKeys });
  });

  // 4. Khóa / Mở khóa Key
  app.post('/api/admin/keys/toggle', requireAdmin, (req, res) => {
    const { keyId, isActive } = req.body;
    adminToggleKey(keyId, isActive);
    res.json({ success: true, message: `Đã ${isActive ? 'kích hoạt' : 'khóa'} key thành công.` });
  });

  // 5. Lấy danh sách người chơi
  app.get('/api/admin/users', requireAdmin, (req, res) => {
    const users = adminGetAllUsers(100);
    res.json({ success: true, users });
  });

  // 6. Cập nhật số dư / level / ban người chơi
  app.post('/api/admin/users/update', requireAdmin, (req, res) => {
    const { userId, xu, luong, level, isBanned } = req.body;
    const success = adminUpdateUser(userId, {
      xu: xu !== undefined ? Number(xu) : undefined,
      luong: luong !== undefined ? Number(luong) : undefined,
      level: level !== undefined ? Number(level) : undefined,
      isBanned: isBanned !== undefined ? Boolean(isBanned) : undefined,
    });

    res.json({ success, message: success ? 'Cập nhật người chơi thành công.' : 'Không tìm thấy người chơi.' });
  });

  // 7. Đá người chơi ra khỏi game
  app.post('/api/admin/users/kick', requireAdmin, (req, res) => {
    const { keyCode, reason } = req.body;
    const kicked = adminKickUser(keyCode, reason);
    res.json({ success: kicked, message: kicked ? 'Đã ngắt kết nối người chơi.' : 'Người chơi không online.' });
  });

  // 8. Tặng quà / vật phẩm vào túi đồ
  app.post('/api/admin/users/gift', requireAdmin, (req, res) => {
    const { userId, item } = req.body;
    const success = adminGiftItem(userId, item);
    res.json({ success, message: success ? 'Đã tặng quà thành công.' : 'Lỗi tặng quà.' });
  });

  // 9. Phát thông báo toàn máy chủ (Global Broadcast Marquee)
  app.post('/api/admin/broadcast', requireAdmin, (req, res) => {
    const { text, type = 'banner' } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Nội dung thông báo không được để trống.' });
    }

    if (broadcastGlobalMessage) {
      broadcastGlobalMessage({
        type: 'GLOBAL_ANNOUNCEMENT',
        text: text.trim(),
        sender: req.adminUser.nickname || 'Quản Trị Viên',
        time: new Date().toLocaleTimeString('vi-VN'),
      });
    }

    res.json({ success: true, message: 'Đã phát thông báo toàn máy chủ thành công!' });
  });
}
