import { db } from './db.js';
import { getUserById, saveUserProfile, updateUserBalance } from './keyManager.js';

export const BASE_DAILY_QUESTS = [
  { id: 'quest_harvest', title: 'Thu hoạch 6 luống nông sản', type: 'harvest', target: 6, rewardXu: 600, rewardExp: 80, icon: '🌾' },
  { id: 'quest_fish', title: 'Câu thành công 3 con cá ở hồ', type: 'fish', target: 3, rewardXu: 800, rewardExp: 100, icon: '🎣' },
  { id: 'quest_baucua', title: 'Thử vận may 2 ván Bầu Cua', type: 'baucua', target: 2, rewardXu: 500, rewardExp: 60, icon: '🎲' },
  { id: 'quest_sell', title: 'Bán nông sản hoặc cá thu về 1,000 Xu', type: 'sell_items', target: 1000, rewardXu: 700, rewardExp: 90, icon: '💰' },
  { id: 'quest_chicken', title: 'Thu thập 2 quả trứng gà trong chuồng', type: 'chicken', target: 2, rewardXu: 450, rewardExp: 50, icon: '🥚' },
];

/**
 * Khởi tạo hoặc Reset nhiệm vụ mỗi ngày
 */
export function getOrRefreshDailyQuests(user) {
  let quests = user.quests || [];
  const now = Date.now();
  const lastReset = user.lastQuestReset ? new Date(user.lastQuestReset).getTime() : 0;

  // Nếu quá 24h hoặc chưa có nhiệm vụ
  if (quests.length === 0 || (now - lastReset) > 24 * 60 * 60 * 1000) {
    quests = BASE_DAILY_QUESTS.map(q => ({
      id: q.id,
      title: q.title,
      type: q.type,
      progress: 0,
      target: q.target,
      rewardXu: q.rewardXu,
      rewardExp: q.rewardExp,
      completed: false,
      claimed: false,
      icon: q.icon,
    }));
    saveUserProfile(user.id, { quests });
    db.prepare('UPDATE users SET last_quest_reset = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  }

  return quests;
}

/**
 * Tăng tiến độ nhiệm vụ từ server
 */
export function updateQuestProgress(userId, questType, amount = 1) {
  const user = getUserById(userId);
  if (!user) return;

  const quests = getOrRefreshDailyQuests(user);
  let updated = false;

  for (const quest of quests) {
    if (quest.type === questType && !quest.completed) {
      quest.progress = Math.min(quest.target, quest.progress + amount);
      if (quest.progress >= quest.target) {
        quest.completed = true;
      }
      updated = true;
    }
  }

  if (updated) {
    saveUserProfile(userId, { quests });
  }
}

/**
 * Nhận thưởng nhiệm vụ
 */
export function claimQuestReward(userId, questId) {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'Không tìm thấy người chơi.' };

  const quests = getOrRefreshDailyQuests(user);
  const quest = quests.find(q => q.id === questId);

  if (!quest) return { success: false, error: 'Nhiệm vụ không tồn tại.' };
  if (!quest.completed) return { success: false, error: 'Nhiệm vụ chưa hoàn thành.' };
  if (quest.claimed) return { success: false, error: 'Nhiệm vụ này đã nhận thưởng rồi.' };

  quest.claimed = true;

  // Cộng Xu và Exp
  updateUserBalance(userId, quest.rewardXu, 0);

  const newExp = user.exp + quest.rewardExp;
  const maxExp = user.level * 150;
  let level = user.level;
  let currentExp = newExp;
  if (currentExp >= maxExp) {
    level += 1;
    currentExp -= maxExp;
  }

  saveUserProfile(userId, { quests, level, exp: currentExp });

  return {
    success: true,
    user: getUserById(userId),
    rewardXu: quest.rewardXu,
    rewardExp: quest.rewardExp,
    message: `Nhận thưởng thành công: +${quest.rewardXu.toLocaleString()} Xu & +${quest.rewardExp} EXP!`
  };
}
