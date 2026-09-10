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
export function formatUserProfile(record) {
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

// Danh sách NPC & Đại gia Danh Dự mẫu
export const MOCK_BOT_PROFILES = {
  'bot_congtu': {
    id: 'bot_congtu',
    username: 'congtubaclieu',
    nickname: 'Công Tử Bạc Liêu',
    role: 'player',
    gender: 'male',
    level: 99,
    exp: 14850,
    maxExp: 15000,
    xu: 2500000,
    luong: 888,
    energy: 100,
    maxEnergy: 300,
    equippedHouseId: 'house_castle',
    equippedVehicleId: 'veh_pegasus',
    houses: ['house_leaf', 'house_tile', 'house_town', 'house_villa', 'house_castle'],
    vehicles: ['veh_bicycle', 'veh_cub50', 'veh_sh', 'veh_supercar', 'veh_pegasus', 'veh_ufo'],
    appearance: {
      skinColor: '#fcd34d',
      hairStyle: 'spiky',
      hairColor: '#eab308',
      shirtStyle: 'vest',
      shirtColor: '#ca8a04',
      pantsStyle: 'jeans',
      pantsColor: '#172554',
      hat: 'crown',
      wings: 'angel',
      glasses: 'black',
    },
    inventory: [
      { id: 'fish_golden_turtle', name: 'Rùa Vàng Nghìn Năm', type: 'fish', count: 3, sellPrice: 15000, icon: '🐢', description: 'Thần Kim Quy ngậm ngọc' },
      { id: 'fish_dragon', name: 'Cá Rồng Kim Long Thần Thoại', type: 'fish', count: 5, sellPrice: 10000, icon: '🐉', description: 'Huyền thoại hồ câu Avatar' },
      { id: 'golden_apple', name: 'Táo Vàng Thần Thoại', type: 'crop', count: 20, sellPrice: 10000, icon: '🍎', description: 'Trái cây thần tích' },
      { id: 'rod_titan', name: 'Cần Titan Sấm Sét', type: 'fashion', count: 1, sellPrice: 35000, icon: '🔱', description: 'Bảo vật của Vua Thủy Tề' },
      { id: 'wings_demon', name: 'Cánh Ác Ma Lửa', type: 'fashion', count: 1, sellPrice: 40, icon: '🦇', description: 'Cánh dơi quỷ vương ma mị' },
    ],
    farmPlots: [],
    chickens: [{ id: 1, fed: true, eggsReady: true, fedAt: Date.now() - 70000 }],
    pigs: [{ id: 1, fed: true, productReady: true, fedAt: Date.now() - 160000 }],
    stats: {
      cropsHarvested: 5200,
      fishCaught: 3800,
      miniGamesPlayed: 990,
      miniGamesWon: 780,
      moneyEarned: 15000000,
    }
  },
  'bot_coba': {
    id: 'bot_coba',
    username: 'cobasaigon',
    nickname: 'Cô Ba Sài Gòn',
    role: 'player',
    gender: 'female',
    level: 68,
    exp: 9200,
    maxExp: 10200,
    xu: 1820000,
    luong: 350,
    energy: 100,
    maxEnergy: 200,
    equippedHouseId: 'house_villa',
    equippedVehicleId: 'veh_sh',
    houses: ['house_leaf', 'house_tile', 'house_town', 'house_villa'],
    vehicles: ['veh_bicycle', 'veh_cub50', 'veh_sh'],
    appearance: {
      skinColor: '#fde047',
      hairStyle: 'long',
      hairColor: '#1c1917',
      shirtStyle: 'dress',
      shirtColor: '#ec4899',
      pantsStyle: 'skirt',
      pantsColor: '#be185d',
      hat: 'flower',
      wings: 'angel',
      glasses: 'cool',
    },
    inventory: [
      { id: 'orchid', name: 'Hoa Lan Quý Tộc', type: 'crop', count: 15, sellPrice: 1500, icon: '🌸', description: 'Hoa lan rừng quý hiếm' },
      { id: 'strawberry', name: 'Dâu Tây Hoàng Gia', type: 'crop', count: 30, sellPrice: 4500, icon: '🍓', description: 'Dâu tây hoàng gia' },
      { id: 'fish_dolphin', name: 'Cá Heo Bạch Tạng', type: 'fish', count: 2, sellPrice: 5500, icon: '🐬', description: 'Cá heo trắng may mắn' },
      { id: 'hat_crown', name: 'Vương Miện Hoàng Gia', type: 'fashion', count: 1, sellPrice: 25, icon: '👑', description: 'Đính kim cương quý tộc' },
    ],
    farmPlots: [],
    chickens: [{ id: 1, fed: true, eggsReady: true, fedAt: Date.now() - 70000 }],
    pigs: [],
    stats: {
      cropsHarvested: 2900,
      fishCaught: 1420,
      miniGamesPlayed: 450,
      miniGamesWon: 310,
      moneyEarned: 6500000,
    }
  },
  'bot_nongdan': {
    id: 'bot_nongdan',
    username: 'bacbanongdan',
    nickname: 'Bác Ba Nông Dân',
    role: 'player',
    gender: 'male',
    level: 45,
    exp: 5800,
    maxExp: 6750,
    xu: 950000,
    luong: 80,
    energy: 100,
    maxEnergy: 130,
    equippedHouseId: 'house_tile',
    equippedVehicleId: 'veh_cub50',
    houses: ['house_leaf', 'house_tile'],
    vehicles: ['veh_bicycle', 'veh_cub50'],
    appearance: {
      skinColor: '#f59e0b',
      hairStyle: 'short',
      hairColor: '#451a03',
      shirtStyle: 'tshirt',
      shirtColor: '#15803d',
      pantsStyle: 'shorts',
      pantsColor: '#1e3a8a',
      hat: 'straw',
      glasses: 'black',
    },
    inventory: [
      { id: 'watermelon', name: 'Dưa Hấu Đỏ', type: 'crop', count: 50, sellPrice: 1900, icon: '🍉', description: 'Trái dưa hấu đỏ chín mọng' },
      { id: 'grape', name: 'Nho Tím Ninh Thuận', type: 'crop', count: 40, sellPrice: 3200, icon: '🍇', description: 'Chùm nho mọng nước' },
      { id: 'fish_snakehead', name: 'Cá Lóc Đồng (Cá Quả)', type: 'fish', count: 18, sellPrice: 280, icon: '🐟', description: 'Cá lóc săn mồi' },
    ],
    farmPlots: [],
    chickens: [{ id: 1, fed: true, eggsReady: true, fedAt: Date.now() - 70000 }, { id: 2, fed: true, eggsReady: true, fedAt: Date.now() - 70000 }],
    pigs: [{ id: 1, fed: true, productReady: true, fedAt: Date.now() - 160000 }],
    stats: {
      cropsHarvested: 8900,
      fishCaught: 950,
      miniGamesPlayed: 120,
      miniGamesWon: 60,
      moneyEarned: 3200000,
    }
  }
};

/**
 * Tìm người chơi theo ID, Nickname hoặc Username
 */
export function getUserByNicknameOrId(idOrNickname) {
  if (!idOrNickname) return null;
  const target = String(idOrNickname).trim();

  // Kiểm tra nếu là Bot
  if (MOCK_BOT_PROFILES[target]) {
    return MOCK_BOT_PROFILES[target];
  }
  for (const bot of Object.values(MOCK_BOT_PROFILES)) {
    if (bot.nickname.toLowerCase() === target.toLowerCase() || bot.username.toLowerCase() === target.toLowerCase()) {
      return bot;
    }
  }

  // Tra cứu trong Database
  const stmt = db.prepare('SELECT * FROM users WHERE id = ? OR LOWER(nickname) = LOWER(?) OR LOWER(username) = LOWER(?)');
  const record = stmt.get(target, target, target);
  if (!record) return null;
  return formatUserProfile(record);
}

/**
 * Lấy bảng xếp hạng Top Người Chơi thực tế từ SQLite
 */
export function getLeaderboardData() {
  const allUsers = db.prepare(`
    SELECT * FROM users WHERE is_banned = 0
  `).all().map(formatUserProfile);

  // Kết hợp người chơi thật và Bot đại gia vào bảng xếp hạng
  const combined = [...allUsers, ...Object.values(MOCK_BOT_PROFILES)];

  const topXu = [...combined].sort((a, b) => (b.xu || 0) - (a.xu || 0)).slice(0, 15);
  const topFish = [...combined].sort((a, b) => ((b.stats && b.stats.fishCaught) || 0) - ((a.stats && a.stats.fishCaught) || 0)).slice(0, 15);
  const topFarm = [...combined].sort((a, b) => ((b.stats && b.stats.cropsHarvested) || 0) - ((a.stats && a.stats.cropsHarvested) || 0)).slice(0, 15);
  const topLevel = [...combined].sort((a, b) => (b.level !== a.level ? (b.level || 0) - (a.level || 0) : (b.exp || 0) - (a.exp || 0))).slice(0, 15);

  return {
    topXu,
    topFish,
    topFarm,
    topLevel,
  };
}

