import { db } from './db.js';
import { getUserById, saveUserProfile, updateUserBalance } from './keyManager.js';

// ==========================================
// 1. DANH SÁCH NHIỆM VỤ CHÍNH TUYẾN (CỐT TRUYỆN TÂN THỦ ➔ ĐẠI GIA)
// ==========================================
export const BASE_MAIN_QUESTS = [
  {
    id: 'main_1_harvest_rice',
    category: 'main',
    order: 1,
    chapter: 1,
    chapterTitle: 'Chương 1: Khởi Nghiệp Nông Dân',
    title: 'Gieo & Thu hoạch 3 luống lúa',
    description: 'Mua hạt giống lúa trong Nông Trại, gieo và gặt 3 luống lúa đầu tiên.',
    type: 'harvest',
    target: 3,
    rewardXu: 1000,
    rewardLuong: 2,
    rewardExp: 80,
    icon: '🌾',
  },
  {
    id: 'main_2_catch_fish',
    category: 'main',
    order: 2,
    chapter: 1,
    chapterTitle: 'Chương 1: Khởi Nghiệp Nông Dân',
    title: 'Thử tài câu cá ven hồ',
    description: 'Đến Hồ Câu, trang bị cần câu và giật 3 chú cá đầu tiên.',
    type: 'fish',
    target: 3,
    rewardXu: 1500,
    rewardLuong: 3,
    rewardExp: 100,
    rewardItemName: '🎋 Cần Trúc Sen Ngọc',
    icon: '🎣',
  },
  {
    id: 'main_3_sell_market',
    category: 'main',
    order: 3,
    chapter: 1,
    chapterTitle: 'Chương 1: Khởi Nghiệp Nông Dân',
    title: 'Bán nông sản kiếm 2,000 Xu',
    description: 'Bán hoa màu hoặc cá câu được cho Thương Lái để tích lũy vốn ban đầu.',
    type: 'sell_items',
    target: 2000,
    rewardXu: 2000,
    rewardLuong: 5,
    rewardExp: 150,
    icon: '💰',
  },
  {
    id: 'main_4_buy_chicken',
    category: 'main',
    order: 4,
    chapter: 2,
    chapterTitle: 'Chương 2: Mở Rộng Chuồng Trại',
    title: 'Nuôi chú gà con đầu tiên',
    description: 'Vào chuồng trại mua 1 Gà con và cho ăn thóc để đẻ trứng vàng.',
    type: 'buy_chicken',
    target: 1,
    rewardXu: 3000,
    rewardLuong: 5,
    rewardExp: 180,
    rewardItemName: '🌾 10 Thóc Cho Gà',
    icon: '🐔',
  },
  {
    id: 'main_5_park_visit',
    category: 'main',
    order: 5,
    chapter: 2,
    chapterTitle: 'Chương 2: Mở Rộng Chuồng Trại',
    title: 'Giao lưu tại Công Viên Avatar',
    description: 'Đến Công Viên, ném xu đài ước nguyện hoặc chat giao lưu với cư dân khác.',
    type: 'park_interact',
    target: 1,
    rewardXu: 2500,
    rewardLuong: 5,
    rewardExp: 150,
    icon: '⛲',
  },
  {
    id: 'main_6_buy_vehicle',
    category: 'main',
    order: 6,
    chapter: 3,
    chapterTitle: 'Chương 3: Sắm Xe & Nâng Cấp Nhà',
    title: 'Tậu chiếc xe đầu tiên dạo phố',
    description: 'Ghé Showroom Xe Cộ sắm 1 chiếc Xe Đạp hoặc Cub 50cc để tăng tốc độ di chuyển.',
    type: 'buy_vehicle',
    target: 1,
    rewardXu: 5000,
    rewardLuong: 10,
    rewardExp: 250,
    icon: '🚲',
  },
  {
    id: 'main_7_buy_house',
    category: 'main',
    order: 7,
    chapter: 3,
    chapterTitle: 'Chương 3: Sắm Xe & Nâng Cấp Nhà',
    title: 'Nâng cấp Bất Động Sản',
    description: 'Mua ngôi Nhà Ngói Ba Gian hoặc Nhà Phố để tăng Thể Lực và tốc độ hồi phục.',
    type: 'buy_house',
    target: 1,
    rewardXu: 8000,
    rewardLuong: 15,
    rewardExp: 350,
    icon: '🏡',
  },
  {
    id: 'main_8_market_trade',
    category: 'main',
    order: 8,
    chapter: 4,
    chapterTitle: 'Chương 4: Thương Gia Chợ Đêm',
    title: 'Kinh doanh trên Chợ Đêm',
    description: 'Treo bán hoặc mua 1 món đồ từ người chơi khác trên Sàn Giao Dịch Chợ Đêm.',
    type: 'market_trade',
    target: 1,
    rewardXu: 10000,
    rewardLuong: 20,
    rewardExp: 400,
    icon: '🏪',
  },
  {
    id: 'main_9_baucua_win',
    category: 'main',
    order: 9,
    chapter: 5,
    chapterTitle: 'Chương 5: Vận May Thần Tài',
    title: 'Thắng 3 ván Bầu Cua Tôm Cá',
    description: 'Đến Sòng Bài, nặn bát và chiến thắng 3 ván cược Bầu Cua.',
    type: 'baucua_win',
    target: 3,
    rewardXu: 20000,
    rewardLuong: 30,
    rewardExp: 600,
    rewardItemName: '🦇 Cánh Ác Ma Lửa',
    icon: '🎲',
  },
  {
    id: 'main_10_tycoon',
    category: 'main',
    order: 10,
    chapter: 6,
    chapterTitle: 'Chương 6: Đỉnh Cao Phú Hào',
    title: 'Trở thành Đại Gia Avatar',
    description: 'Đạt Cấp Lv.5 hoặc sở hữu Biệt Thự Vườn / Siêu Xe Lambo.',
    type: 'reach_tycoon',
    target: 1,
    rewardXu: 50000,
    rewardLuong: 100,
    rewardExp: 1500,
    rewardItemName: '👑 Vương Miện Hoàng Gia',
    icon: '👑',
  }
];

// ==========================================
// 2. DANH SÁCH NHIỆM VỤ HẰNG NGÀY (LÀM MỚI MỖI 24H)
// ==========================================
export const BASE_DAILY_QUESTS = [
  { id: 'daily_harvest', category: 'daily', title: 'Nông Dân Cần Cù: Gặt 8 hoa màu', type: 'harvest', target: 8, rewardXu: 800, rewardExp: 80, icon: '🌾' },
  { id: 'daily_fish', category: 'daily', title: 'Cần Thủ Ven Hồ: Câu 4 con cá', type: 'fish', target: 4, rewardXu: 900, rewardExp: 90, icon: '🐟' },
  { id: 'daily_feed', category: 'daily', title: 'Chăm Sóc Chuồng Trại: Cho ăn 2 lần', type: 'feed_animal', target: 2, rewardXu: 600, rewardExp: 60, icon: '🐔' },
  { id: 'daily_park', category: 'daily', title: 'Dạo Mát Công Viên: Ném xu hoặc chat', type: 'park_interact', target: 1, rewardXu: 500, rewardExp: 50, icon: '⛲' },
  { id: 'daily_baucua', category: 'daily', title: 'Thử Vận May: Cược 2 ván Bầu Cua', type: 'baucua_play', target: 2, rewardXu: 700, rewardLuong: 1, rewardExp: 70, icon: '🎲' },
];

/**
 * Khởi tạo hoặc Reset nhiệm vụ mỗi ngày
 */
export function getOrRefreshDailyQuests(user) {
  let existingQuests = user.quests || [];
  const now = Date.now();
  const lastReset = user.lastQuestReset ? new Date(user.lastQuestReset).getTime() : 0;
  const is24hPassed = (now - lastReset) > 24 * 60 * 60 * 1000;

  // Lọc ra nhiệm vụ chính tuyến hiện có
  let mainQuests = existingQuests.filter(q => q.category === 'main');
  if (mainQuests.length === 0) {
    // Khởi tạo mới toàn bộ chuỗi chính tuyến
    mainQuests = BASE_MAIN_QUESTS.map(q => ({
      ...q,
      progress: 0,
      completed: false,
      claimed: false,
    }));
  }

  // Lọc ra nhiệm vụ hằng ngày
  let dailyQuests = existingQuests.filter(q => q.category === 'daily');
  if (dailyQuests.length === 0 || is24hPassed) {
    // Reset nhiệm vụ hằng ngày mới
    dailyQuests = BASE_DAILY_QUESTS.map(q => ({
      ...q,
      progress: 0,
      completed: false,
      claimed: false,
    }));
    db.prepare('UPDATE users SET last_quest_reset = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  }

  const combined = [...mainQuests, ...dailyQuests];
  saveUserProfile(user.id, { quests: combined });
  return combined;
}

/**
 * Tăng tiến độ nhiệm vụ từ server
 */
export function updateQuestProgress(userId, questType, amount = 1) {
  const user = getUserById(userId);
  if (!user) return;

  const quests = getOrRefreshDailyQuests(user);
  let updated = false;

  // 1. Cập nhật các nhiệm vụ hằng ngày phù hợp
  for (const quest of quests.filter(q => q.category === 'daily')) {
    if (quest.type === questType && !quest.completed) {
      quest.progress = Math.min(quest.target, quest.progress + amount);
      if (quest.progress >= quest.target) {
        quest.completed = true;
      }
      updated = true;
    }
  }

  // 2. Cập nhật nhiệm vụ chính tuyến đang kích hoạt theo thứ tự (Sequential Unlock)
  const mainQuests = quests.filter(q => q.category === 'main');
  for (const quest of mainQuests) {
    if (quest.type === questType && !quest.completed) {
      quest.progress = Math.min(quest.target, quest.progress + amount);
      if (quest.progress >= quest.target) {
        quest.completed = true;
      }
      updated = true;
      break; // Chỉ cộng vào nhiệm vụ chính tuyến đang mở hiện tại
    } else if (!quest.claimed) {
      // Nếu có nhiệm vụ chưa hoàn thành trước đó và khác type, vẫn cho phép làm nếu phù hợp
      if (quest.type === questType && !quest.completed) {
        quest.progress = Math.min(quest.target, quest.progress + amount);
        if (quest.progress >= quest.target) {
          quest.completed = true;
        }
        updated = true;
      }
    }
  }

  if (updated) {
    saveUserProfile(userId, { quests });
  }
}

/**
 * Nhận thưởng nhiệm vụ (Chính tuyến hoặc Hằng ngày)
 */
export function claimQuestReward(userId, questId) {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'Không tìm thấy người chơi.' };

  const quests = getOrRefreshDailyQuests(user);
  const quest = quests.find(q => q.id === questId);

  if (!quest) return { success: false, error: 'Nhiệm vụ không tồn tại.' };
  if (!quest.completed) return { success: false, error: 'Nhiệm vụ chưa hoàn thành chỉ tiêu.' };
  if (quest.claimed) return { success: false, error: 'Nhiệm vụ này đã được nhận thưởng rồi.' };

  quest.claimed = true;

  // Cộng Xu và Lượng
  const rewardXu = quest.rewardXu || 0;
  const rewardLuong = quest.rewardLuong || 0;
  const rewardExp = quest.rewardExp || 0;

  updateUserBalance(userId, rewardXu, rewardLuong);

  // Trao vật phẩm thưởng đặc biệt nếu có
  const inventory = [...user.inventory];
  if (quest.id === 'main_2_catch_fish') {
    inventory.push({ id: 'rod_lotus', name: 'Cần Trúc Sen Ngọc', type: 'rod', count: 1, sellPrice: 600, icon: '🎣', description: 'Tăng 20% may mắn câu cá hiếm.' });
  } else if (quest.id === 'main_4_buy_chicken') {
    inventory.push({ id: 'feed_chicken', name: 'Thóc Cám Cho Gà', type: 'consumable', count: 10, sellPrice: 10, icon: '🌾', description: 'Thức ăn giúp gà đẻ trứng sau 60s.' });
  } else if (quest.id === 'main_9_baucua_win') {
    inventory.push({ id: 'wings_demon', name: 'Cánh Ác Ma Lửa', type: 'fashion', count: 1, sellPrice: 40, icon: '🦇', description: 'Cánh dơi quỷ vương ma mị thể hiện đẳng cấp.' });
  } else if (quest.id === 'main_10_tycoon') {
    inventory.push({ id: 'hat_crown', name: 'Vương Miện Hoàng Gia', type: 'fashion', count: 1, sellPrice: 25, icon: '👑', description: 'Đính kim cương quý tộc đẳng cấp.' });
  }

  // Tính toán EXP & Level Up
  const newExp = user.exp + rewardExp;
  const maxExp = user.level * 150;
  let level = user.level;
  let currentExp = newExp;
  if (currentExp >= maxExp) {
    level += 1;
    currentExp -= maxExp;
  }

  saveUserProfile(userId, { quests, inventory, level, exp: currentExp });

  let rewardDesc = `+${rewardXu.toLocaleString()} Xu & +${rewardExp} EXP`;
  if (rewardLuong > 0) rewardDesc += ` & +${rewardLuong} Lượng`;
  if (quest.rewardItemName) rewardDesc += ` & ${quest.rewardItemName}`;

  return {
    success: true,
    user: getUserById(userId),
    rewardXu,
    rewardLuong,
    rewardExp,
    message: `🎁 Chúc mừng! Bạn đã nhận thưởng: ${rewardDesc}!`,
  };
}

