import crypto from 'crypto';
import { db } from './db.js';

// Quản lý các phiên đang online trong RAM (chỉ lưu token, userId, keyCode, socket, lastSeen)
export const activeSessions = new Map(); // key_code -> { token, userId, socket: WebSocket, lastSeen, role }
export const tokenToSession = new Map(); // token -> { keyCode, userId, role }

const DEFAULT_APPEARANCE = {
  skinColor: '#fcd34d',
  hairStyle: 'spiky',
  hairColor: '#451a03',
  shirtStyle: 'tshirt',
  shirtColor: '#2563eb',
  pantsStyle: 'jeans',
  pantsColor: '#1e3a8a',
  hat: 'straw',
  handheld: 'rod_bamboo',
  glasses: 'black',
};

const DEFAULT_FARM_PLOTS = Array.from({ length: 6 }, (_, index) => ({
  id: index + 1,
  cropId: null,
  plantedAt: null,
  watered: false,
  hasPest: false,
  fertilized: false,
}));

const DEFAULT_CHICKENS = [];
const DEFAULT_PIGS = [];

/**
 * Đăng nhập bằng mã Key được cấp trong Database
 */
export function validateAndLoginKey(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') {
    return { success: false, error: 'Mã Key không hợp lệ.' };
  }

  const keyCode = rawKey.trim().toUpperCase();

  // 1. Kiểm tra key trong database
  const keyStmt = db.prepare('SELECT * FROM access_keys WHERE key_code = ?');
  const keyRecord = keyStmt.get(keyCode);

  if (!keyRecord) {
    return { success: false, error: 'Mã Key này không tồn tại trong hệ thống.' };
  }

  if (keyRecord.is_active !== 1) {
    return { success: false, error: 'Mã Key này đã bị tạm khóa bởi Quản trị viên.' };
  }

  // 2. Tìm hoặc khởi tạo người chơi gắn với Key này
  const userStmt = db.prepare('SELECT * FROM users WHERE key_code = ?');
  let userRecord = userStmt.get(keyCode);

  if (!userRecord) {
    // Tạo mới tài khoản cho lần đầu kích hoạt key
    const newUserId = `u_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const isSpecialAdmin = keyRecord.role === 'admin';
    const nickname = keyRecord.assigned_name || (isSpecialAdmin ? 'Admin Tổng' : `Nông Dân ${keyCode.slice(-4)}`);
    const username = `player_${keyCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const insertUser = db.prepare(`
      INSERT INTO users (
        id, key_code, username, nickname, role, gender, level, exp, xu, luong, energy, max_energy,
        appearance_json, farm_plots_json, chickens_json, houses_json, vehicles_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      newUserId,
      keyCode,
      username,
      nickname,
      keyRecord.role || 'player',
      'male',
      isSpecialAdmin ? 99 : 1,
      0,
      keyRecord.initial_xu || 20000,
      keyRecord.initial_luong || 20,
      100,
      100,
      JSON.stringify(DEFAULT_APPEARANCE),
      JSON.stringify(DEFAULT_FARM_PLOTS),
      JSON.stringify(DEFAULT_CHICKENS),
      JSON.stringify(['house_leaf']),
      JSON.stringify([])
    );

    userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(newUserId);
  } else if (userRecord.is_banned === 1) {
    return { success: false, error: 'Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm quy định.' };
  }

  // Cập nhật thời gian sử dụng gần nhất của Key
  db.prepare('UPDATE access_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?').run(keyRecord.id);

  // 3. Tạo Token phiên làm việc mới
  const token = crypto.randomBytes(24).toString('hex');

  // 4. Kiểm tra và ngắt kết nối phiên cũ (Single-Session Enforcement)
  if (activeSessions.has(keyCode)) {
    const oldSession = activeSessions.get(keyCode);
    if (oldSession && oldSession.socket && oldSession.socket.readyState === 1) {
      try {
        oldSession.socket.send(JSON.stringify({
          type: 'KICK_DUPLICATE_LOGIN',
          message: 'Tài khoản của bạn vừa đăng nhập ở một thiết bị hoặc tab khác.'
        }));
        oldSession.socket.close();
      } catch (err) {
        // Ignored
      }
    }
    if (oldSession && oldSession.token) {
      tokenToSession.delete(oldSession.token);
    }
  }

  // Lưu phiên mới vào bộ nhớ RAM
  const sessionData = {
    token,
    userId: userRecord.id,
    keyCode,
    role: userRecord.role || 'player',
    lastSeen: Date.now(),
  };
  activeSessions.set(keyCode, sessionData);
  tokenToSession.set(token, { keyCode, userId: userRecord.id, role: userRecord.role || 'player' });

  // 5. Chuẩn hóa Profile trả về cho Client
  const userProfile = formatUserProfile(userRecord);

  return {
    success: true,
    token,
    role: userRecord.role || 'player',
    user: userProfile,
  };
}

/**
 * Lấy UserProfile từ Token
 */
export function getUserByToken(token) {
  const session = tokenToSession.get(token);
  if (!session) return null;
  return getUserById(session.userId);
}

/**
 * Lấy UserProfile từ User ID
 */
export function getUserById(userId) {
  const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const userRecord = userStmt.get(userId);
  if (!userRecord) return null;
  return formatUserProfile(userRecord);
}

/**
 * Cập nhật số dư Xu/Lượng an toàn
 */
export function updateUserBalance(userId, deltaXu = 0, deltaLuong = 0) {
  const stmt = db.prepare(`
    UPDATE users 
    SET xu = xu + ?, luong = luong + ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND xu + ? >= 0
  `);
  const result = stmt.run(deltaXu, deltaLuong, userId, deltaXu);
  return result.changes > 0;
}

/**
 * Cập nhật toàn bộ thông tin người chơi (Appearance, Farm, Inventory...)
 */
export function saveUserProfile(userId, updates) {
  const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!currentUser) return false;

  const xu = updates.xu !== undefined ? updates.xu : currentUser.xu;
  const luong = updates.luong !== undefined ? updates.luong : currentUser.luong;
  const level = updates.level !== undefined ? updates.level : currentUser.level;
  const exp = updates.exp !== undefined ? updates.exp : currentUser.exp;
  const energy = updates.energy !== undefined ? updates.energy : currentUser.energy;
  const maxEnergy = updates.maxEnergy !== undefined ? updates.maxEnergy : currentUser.max_energy;
  const equippedHouseId = updates.equippedHouseId !== undefined ? updates.equippedHouseId : currentUser.equipped_house_id;
  const equippedVehicleId = updates.equippedVehicleId !== undefined ? updates.equippedVehicleId : currentUser.equipped_vehicle_id;

  const appearanceJson = updates.appearance ? JSON.stringify(updates.appearance) : currentUser.appearance_json;
  const farmPlotsJson = updates.farmPlots ? JSON.stringify(updates.farmPlots) : currentUser.farm_plots_json;
  const chickensJson = updates.chickens ? JSON.stringify(updates.chickens) : currentUser.chickens_json;
  const inventoryJson = updates.inventory ? JSON.stringify(updates.inventory) : currentUser.inventory_json;
  const housesJson = updates.houses ? JSON.stringify(updates.houses) : currentUser.houses_json;
  const vehiclesJson = updates.vehicles ? JSON.stringify(updates.vehicles) : currentUser.vehicles_json;
  const questsJson = updates.quests ? JSON.stringify(updates.quests) : currentUser.quests_json;

  let currentStats = {};
  try { currentStats = JSON.parse(currentUser.stats_json || '{}'); } catch {}
  if (updates.pigs !== undefined) {
    currentStats.pigs = updates.pigs;
  }
  if (updates.stats) {
    currentStats = { ...currentStats, ...updates.stats };
  }
  const statsJson = JSON.stringify(currentStats);

  db.prepare(`
    UPDATE users SET
      xu = ?, luong = ?, level = ?, exp = ?, energy = ?, max_energy = ?,
      equipped_house_id = ?, equipped_vehicle_id = ?,
      appearance_json = ?, farm_plots_json = ?, chickens_json = ?,
      inventory_json = ?, houses_json = ?, vehicles_json = ?,
      quests_json = ?, stats_json = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    xu, luong, level, exp, energy, maxEnergy,
    equippedHouseId, equippedVehicleId,
    appearanceJson, farmPlotsJson, chickensJson,
    inventoryJson, housesJson, vehiclesJson,
    questsJson, statsJson,
    userId
  );

  return true;
}

/**
 * Các hàm Quản Trị Hệ Thống (ADMIN API)
 */
export function adminGetAllKeys(limit = 100) {
  const stmt = db.prepare('SELECT * FROM access_keys ORDER BY id DESC LIMIT ?');
  return stmt.all(limit);
}

export function adminCreateKeys({ count = 1, prefix = 'KEY', role = 'player', xu = 50000, luong = 20, assignedName = '', note = '' }) {
  const insertStmt = db.prepare(`
    INSERT INTO access_keys (key_code, role, assigned_name, initial_xu, initial_luong, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const createdKeys = [];
  for (let i = 0; i < count; i++) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const keyCode = `${prefix.toUpperCase()}-${randomHex}`;
    try {
      insertStmt.run(keyCode, role, assignedName || `Người chơi ${keyCode.slice(-4)}`, xu, luong, note);
      createdKeys.push(keyCode);
    } catch (e) {
      // Bỏ qua nếu trùng key
    }
  }
  return createdKeys;
}

export function adminToggleKey(keyId, isActive) {
  const stmt = db.prepare('UPDATE access_keys SET is_active = ? WHERE id = ?');
  return stmt.run(isActive ? 1 : 0, keyId);
}

export function adminGetAllUsers(limit = 100) {
  const stmt = db.prepare('SELECT id, key_code, username, nickname, role, level, exp, xu, luong, energy, is_banned, updated_at FROM users ORDER BY updated_at DESC LIMIT ?');
  const users = stmt.all(limit);
  return users.map(u => ({
    ...u,
    isOnline: activeSessions.has(u.key_code)
  }));
}

export function adminUpdateUser(userId, { xu, luong, level, isBanned }) {
  const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!currentUser) return false;

  const newXu = xu !== undefined ? xu : currentUser.xu;
  const newLuong = luong !== undefined ? luong : currentUser.luong;
  const newLevel = level !== undefined ? level : currentUser.level;
  const newBanned = isBanned !== undefined ? (isBanned ? 1 : 0) : currentUser.is_banned;

  db.prepare('UPDATE users SET xu = ?, luong = ?, level = ?, is_banned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newXu, newLuong, newLevel, newBanned, userId);

  // Nếu bị ban, đá session ngay lập tức
  if (newBanned === 1 && activeSessions.has(currentUser.key_code)) {
    adminKickUser(currentUser.key_code, 'Tài khoản của bạn đã bị khóa bởi Quản trị viên.');
  }

  return true;
}

export function adminKickUser(keyCode, reason = 'Bạn đã bị mời ra khỏi phòng bởi Quản trị viên.') {
  if (activeSessions.has(keyCode)) {
    const session = activeSessions.get(keyCode);
    if (session && session.socket && session.socket.readyState === 1) {
      try {
        session.socket.send(JSON.stringify({ type: 'KICKED_BY_ADMIN', message: reason }));
        session.socket.close();
      } catch {}
    }
    activeSessions.delete(keyCode);
    if (session && session.token) tokenToSession.delete(session.token);
    return true;
  }
  return false;
}

export function adminGiftItem(userId, item) {
  const user = getUserById(userId);
  if (!user) return false;

  const inventory = [...user.inventory];
  const existing = inventory.find(i => i.id === item.id);
  if (existing) {
    existing.count += item.count || 1;
  } else {
    inventory.push({ ...item, count: item.count || 1 });
  }

  saveUserProfile(userId, { inventory });
  return true;
}

/**
 * Định dạng Record từ DB thành UserProfile của Client
 */
function formatUserProfile(record) {
  let appearance = DEFAULT_APPEARANCE;
  let farmPlots = DEFAULT_FARM_PLOTS;
  let chickens = DEFAULT_CHICKENS;
  let pigs = DEFAULT_PIGS;
  let inventory = [];
  let houses = ['house_leaf'];
  let vehicles = [];
  let quests = [];
  let stats = { cropsHarvested: 0, fishCaught: 0, miniGamesPlayed: 0, miniGamesWon: 0, moneyEarned: 0 };

  try { appearance = JSON.parse(record.appearance_json); } catch {}
  try { farmPlots = JSON.parse(record.farm_plots_json); } catch {}
  try { chickens = JSON.parse(record.chickens_json); } catch {}
  try { inventory = JSON.parse(record.inventory_json); } catch {}
  try { houses = JSON.parse(record.houses_json); } catch {}
  try { vehicles = JSON.parse(record.vehicles_json); } catch {}
  try { quests = JSON.parse(record.quests_json); } catch {}
  try { 
    if (record.stats_json) {
      const parsedStats = JSON.parse(record.stats_json);
      if (parsedStats.pigs) pigs = parsedStats.pigs;
      stats = parsedStats;
    }
  } catch {}

  return {
    id: record.id,
    keyCode: record.key_code,
    username: record.username,
    nickname: record.nickname,
    role: record.role || 'player',
    gender: record.gender || 'male',
    level: record.level || 1,
    exp: record.exp || 0,
    maxExp: (record.level || 1) * 150,
    energy: record.energy !== undefined ? record.energy : 100,
    maxEnergy: record.max_energy || 100,
    xu: record.xu || 0,
    luong: record.luong || 0,
    equippedHouseId: record.equipped_house_id || 'house_leaf',
    equippedVehicleId: record.equipped_vehicle_id || '',
    appearance,
    farmPlots,
    chickens,
    pigs,
    inventory,
    houses,
    vehicles,
    equippedRodId: 'rod_bamboo',
    equippedBaitId: 'bait_worm',
    currentArea: 'farm',
    stats,
    quests,
    lastLogin: Date.now(),
  };
}
