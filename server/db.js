import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đảm bảo thư mục lưu database tồn tại (mount volume ./data ra ngoài)
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'game.db');
console.log(`[DB] Khởi động SQLite tại: ${DB_PATH}`);

export const db = new DatabaseSync(DB_PATH);

export function getDb() {
  return db;
}

// Tối ưu hóa bộ nhớ RAM và hiệu năng ghi đồng thời (Zero-daemon, RAM chỉ ~8MB)
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA cache_size = -2000; -- Giới hạn cache SQLite chỉ 2MB RAM
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
  PRAGMA temp_store = MEMORY;
`);

// Tạo Schema Database toàn diện
db.exec(`
  -- 1. Bảng quản lý mã Key truy cập & Phân quyền Admin
  CREATE TABLE IF NOT EXISTS access_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_code TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'player',          -- 'player' | 'admin'
    assigned_name TEXT,                  -- Tên người được cấp (để admin quản lý)
    initial_xu INTEGER DEFAULT 20000,    -- Số Xu tặng kèm khi kích hoạt lần đầu
    initial_luong INTEGER DEFAULT 20,    -- Số Lượng tặng kèm
    is_active INTEGER DEFAULT 1,         -- 1 = Hoạt động, 0 = Khóa
    note TEXT DEFAULT '',                -- Ghi chú của Admin
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME
  );

  -- 2. Bảng người chơi gắn liền với Key
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    key_code TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    nickname TEXT NOT NULL,
    role TEXT DEFAULT 'player',
    gender TEXT DEFAULT 'male',
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    xu INTEGER DEFAULT 20000,
    luong INTEGER DEFAULT 20,
    energy INTEGER DEFAULT 100,
    max_energy INTEGER DEFAULT 100,
    equipped_house_id TEXT DEFAULT 'house_leaf',
    equipped_vehicle_id TEXT DEFAULT '',
    appearance_json TEXT NOT NULL,
    inventory_json TEXT DEFAULT '[]',
    farm_plots_json TEXT DEFAULT '[]',
    chickens_json TEXT DEFAULT '[]',
    houses_json TEXT DEFAULT '["house_leaf"]',
    vehicles_json TEXT DEFAULT '[]',
    quests_json TEXT DEFAULT '[]',
    last_quest_reset DATETIME DEFAULT CURRENT_TIMESTAMP,
    stats_json TEXT DEFAULT '{}',
    is_banned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(key_code) REFERENCES access_keys(key_code)
  );

  -- 3. Bảng Sàn Giao Dịch / Chợ Đêm Tự Do (Marketplace)
  CREATE TABLE IF NOT EXISTS marketplace_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_icon TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    price_xu INTEGER NOT NULL,
    status TEXT DEFAULT 'active',        -- 'active' | 'sold' | 'cancelled'
    buyer_id TEXT,
    buyer_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sold_at DATETIME,
    FOREIGN KEY(seller_id) REFERENCES users(id)
  );

  -- 4. Bảng lịch sử ván Bầu Cua
  CREATE TABLE IF NOT EXISTS baucua_rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round_uuid TEXT UNIQUE NOT NULL,
    dice_1 TEXT NOT NULL,
    dice_2 TEXT NOT NULL,
    dice_3 TEXT NOT NULL,
    total_bets_xu INTEGER DEFAULT 0,
    total_payout_xu INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 5. Bảng chi tiết cược Bầu Cua của từng người chơi
  CREATE TABLE IF NOT EXISTS baucua_bets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    choice TEXT NOT NULL,
    bet_amount INTEGER NOT NULL,
    payout_amount INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(round_id) REFERENCES baucua_rounds(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_access_keys_code ON access_keys(key_code);
  CREATE INDEX IF NOT EXISTS idx_users_key ON users(key_code);
  CREATE INDEX IF NOT EXISTS idx_market_status ON marketplace_listings(status);
  CREATE INDEX IF NOT EXISTS idx_baucua_rounds_created ON baucua_rounds(created_at DESC);
`);

// Tự động Khởi tạo các mã Key mẫu & Master Admin Key nếu DB mới tinh
const countStmt = db.prepare('SELECT COUNT(*) as count FROM access_keys');
const { count } = countStmt.get();

if (count === 0) {
  console.log('[DB] Khởi tạo Master Admin Key và các mã Key demo...');
  const insertKey = db.prepare(`
    INSERT INTO access_keys (key_code, role, assigned_name, initial_xu, initial_luong, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // 1. Admin Master Key
  insertKey.run('KEY-ADMIN-ROOT-9999', 'admin', 'Tổng Quản Trị Viên (Admin Root)', 1000000, 500, 'Key Quản trị tối cao');

  // 2. Các Key người chơi mẫu
  insertKey.run('KEY-VIP-8888', 'player', 'Đại Gia VIP 8888', 200000, 100, 'Tặng gói VIP');
  insertKey.run('KEY-TEST-0001', 'player', 'Nông Dân Thử Nghiệm 1', 50000, 30, 'Key người chơi 1');
  insertKey.run('KEY-TEST-0002', 'player', 'Cần Thủ Thử Nghiệm 2', 50000, 30, 'Key người chơi 2');
  insertKey.run('KEY-TEST-0003', 'player', 'Dân Chơi Bầu Cua 3', 50000, 30, 'Key người chơi 3');

  console.log('[DB] Đã tạo thành công Master Admin Key: KEY-ADMIN-ROOT-9999');
  console.log('[DB] Đã tạo 4 key người chơi: KEY-VIP-8888, KEY-TEST-0001, KEY-TEST-0002, KEY-TEST-0003');
}
