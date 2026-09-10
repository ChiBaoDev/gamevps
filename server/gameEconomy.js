import { db } from './db.js';
import { getUserById, saveUserProfile, updateUserBalance } from './keyManager.js';
import { updateQuestProgress } from './questEngine.js';

// ==========================================
// 1. DANH MỤC 50+ VẬT PHẨM TOÀN DIỆN
// ==========================================

export const ALL_CROPS = [
  // Cây ngắn ngày
  { id: 'rice', name: 'Lúa Nước', seedName: 'Hạt Giống Lúa', growDuration: 30, seedPrice: 20, sellPrice: 55, expReward: 10, icon: '🌾', seedIcon: '🌱', levelRequired: 1 },
  { id: 'carrot', name: 'Cà Rốt Đỏ', seedName: 'Hạt Cà Rốt', growDuration: 60, seedPrice: 45, sellPrice: 120, expReward: 20, icon: '🥕', seedIcon: '🌱', levelRequired: 1 },
  { id: 'corn', name: 'Bắp Ngô Vàng', seedName: 'Hạt Bắp Ngô', growDuration: 90, seedPrice: 65, sellPrice: 180, expReward: 30, icon: '🌽', seedIcon: '🌱', levelRequired: 2 },
  { id: 'tomato', name: 'Cà Chua Bi', seedName: 'Hạt Cà Chua', growDuration: 120, seedPrice: 85, sellPrice: 240, expReward: 40, icon: '🍅', seedIcon: '🌱', levelRequired: 2 },
  { id: 'potato', name: 'Khoai Lang Mật', seedName: 'Củ Khoai Giống', growDuration: 150, seedPrice: 110, sellPrice: 320, expReward: 50, icon: '🥔', seedIcon: '🌱', levelRequired: 3 },
  // Hoa cảnh khoe sắc
  { id: 'marigold', name: 'Hoa Cúc Vàng', seedName: 'Hạt Cúc Vàng', growDuration: 180, seedPrice: 140, sellPrice: 420, expReward: 65, icon: '🌼', seedIcon: '🌱', levelRequired: 3 },
  { id: 'rose', name: 'Hoa Hồng Đỏ', seedName: 'Hạt Hoa Hồng', growDuration: 240, seedPrice: 180, sellPrice: 560, expReward: 85, icon: '🌹', seedIcon: '🌱', levelRequired: 4 },
  { id: 'sunflower', name: 'Hoa Hướng Dương', seedName: 'Hạt Hướng Dương', growDuration: 300, seedPrice: 230, sellPrice: 720, expReward: 110, icon: '🌻', seedIcon: '🌱', levelRequired: 4 },
  { id: 'lotus', name: 'Hoa Sen Ngọc', seedName: 'Củ Sen Ngọc', growDuration: 360, seedPrice: 320, sellPrice: 1000, expReward: 150, icon: '🪷', seedIcon: '✨', levelRequired: 5 },
  { id: 'orchid', name: 'Hoa Lan Quý Tộc', seedName: 'Mầm Lan Rừng', growDuration: 450, seedPrice: 450, sellPrice: 1500, expReward: 200, icon: '🌸', seedIcon: '✨', levelRequired: 6 },
  // Trái cây cao cấp
  { id: 'watermelon', name: 'Dưa Hấu Đỏ', seedName: 'Hạt Dưa Hấu', growDuration: 600, seedPrice: 550, sellPrice: 1900, expReward: 250, icon: '🍉', seedIcon: '🌱', levelRequired: 6 },
  { id: 'dragonfruit', name: 'Thanh Long Ruột Đỏ', seedName: 'Nhánh Thanh Long', growDuration: 750, seedPrice: 700, sellPrice: 2500, expReward: 320, icon: '🐉', seedIcon: '🌱', levelRequired: 7 },
  { id: 'grape', name: 'Nho Tím Ninh Thuận', seedName: 'Giống Nho Tím', growDuration: 900, seedPrice: 900, sellPrice: 3200, expReward: 400, icon: '🍇', seedIcon: '🌱', levelRequired: 8 },
  { id: 'strawberry', name: 'Dâu Tây Hoàng Gia', seedName: 'Hạt Dâu Tây Vàng', growDuration: 1200, seedPrice: 1200, sellPrice: 4500, expReward: 550, icon: '🍓', seedIcon: '✨', levelRequired: 9 },
  { id: 'golden_apple', name: 'Táo Vàng Thần Thoại', seedName: 'Mầm Cây Thần', growDuration: 1800, seedPrice: 2500, sellPrice: 10000, expReward: 1000, icon: '🍎', seedIcon: '🌟', levelRequired: 10 },
];

export const ALL_FISH = [
  // Cá đồng quê
  { id: 'fish_carp', name: 'Cá Rô Đồng', rarity: 'common', sellPrice: 65, expReward: 12, difficulty: 1, minBaitLevel: 1, icon: '🐟' },
  { id: 'fish_goby', name: 'Cá Bống Dừa', rarity: 'common', sellPrice: 90, expReward: 18, difficulty: 1, minBaitLevel: 1, icon: '🐟' },
  { id: 'fish_gold', name: 'Cá Chép Vàng', rarity: 'common', sellPrice: 130, expReward: 25, difficulty: 2, minBaitLevel: 1, icon: '🐠' },
  { id: 'fish_catfish', name: 'Cá Trê Mun', rarity: 'common', sellPrice: 180, expReward: 35, difficulty: 2, minBaitLevel: 1, icon: '🐡' },
  { id: 'fish_snakehead', name: 'Cá Lóc Đồng (Cá Quả)', rarity: 'rare', sellPrice: 280, expReward: 55, difficulty: 3, minBaitLevel: 1, icon: '🐟' },
  { id: 'fish_elephant_ear', name: 'Cá Tai Tượng', rarity: 'rare', sellPrice: 380, expReward: 75, difficulty: 3, minBaitLevel: 2, icon: '🐠' },
  // Thủy hải sản ven hồ
  { id: 'fish_blue_shrimp', name: 'Tôm Càng Xanh', rarity: 'rare', sellPrice: 450, expReward: 90, difficulty: 3, minBaitLevel: 2, icon: '🦐' },
  { id: 'fish_mud_crab', name: 'Cua Biển Cà Mau', rarity: 'rare', sellPrice: 550, expReward: 110, difficulty: 3, minBaitLevel: 2, icon: '🦀' },
  { id: 'fish_snail', name: 'Ốc Hương Hoa Sen', rarity: 'rare', sellPrice: 650, expReward: 130, difficulty: 3, minBaitLevel: 2, icon: '🐚' },
  { id: 'fish_squid', name: 'Mực Ống Đại Dương', rarity: 'rare', sellPrice: 800, expReward: 160, difficulty: 3, minBaitLevel: 2, icon: '🦑' },
  // Thủy quái Hiếm & Huyền thoại
  { id: 'fish_clown', name: 'Cá Hề San Hô', rarity: 'epic', sellPrice: 1100, expReward: 220, difficulty: 4, minBaitLevel: 2, icon: '🐠' },
  { id: 'fish_seahorse', name: 'Cá Ngựa Vàng', rarity: 'epic', sellPrice: 1500, expReward: 300, difficulty: 4, minBaitLevel: 3, icon: '🫧' },
  { id: 'fish_ray', name: 'Cá Đuối Khổng Lồ', rarity: 'epic', sellPrice: 2200, expReward: 450, difficulty: 4, minBaitLevel: 3, icon: '🦑' },
  { id: 'fish_shark', name: 'Cá Mập Cắn Cáp', rarity: 'epic', sellPrice: 3500, expReward: 700, difficulty: 4, minBaitLevel: 3, icon: '🦈' },
  { id: 'fish_dolphin', name: 'Cá Heo Bạch Tạng', rarity: 'legendary', sellPrice: 5500, expReward: 1100, difficulty: 5, minBaitLevel: 3, icon: '🐬' },
  { id: 'fish_dragon', name: 'Cá Rồng Kim Long Thần Thoại', rarity: 'legendary', sellPrice: 10000, expReward: 2000, difficulty: 5, minBaitLevel: 3, icon: '🐉' },
  { id: 'fish_golden_turtle', name: 'Rùa Vàng Nghìn Năm', rarity: 'legendary', sellPrice: 15000, expReward: 3000, difficulty: 5, minBaitLevel: 3, icon: '🐢' },
];

export const ALL_FISHING_RODS = [
  { id: 'rod_bamboo', name: 'Cần Tre Đồng Quê', durability: 30, maxDurability: 30, luckBonus: 0, priceXu: 0, priceLuong: 0, icon: '🎋' },
  { id: 'rod_lotus', name: 'Cần Trúc Sen Ngọc', durability: 60, maxDurability: 60, luckBonus: 20, priceXu: 1200, priceLuong: 0, icon: '🎣' },
  { id: 'rod_carbon', name: 'Cần Máy Carbon', durability: 120, maxDurability: 120, luckBonus: 45, priceXu: 3500, priceLuong: 8, icon: '⚡' },
  { id: 'rod_gold', name: 'Cần Hoàng Kim Long', durability: 300, maxDurability: 300, luckBonus: 85, priceXu: 12000, priceLuong: 30, icon: '🌟' },
  { id: 'rod_titan', name: 'Cần Titan Sấm Sét', durability: 800, maxDurability: 800, luckBonus: 150, priceXu: 35000, priceLuong: 80, icon: '🔱' },
];

export const ALL_BAITS = [
  { id: 'bait_worm', name: 'Giun Đất Tươi', priceXu: 20, count: 5, tier: 1, icon: '🪱' },
  { id: 'bait_shrimp', name: 'Tôm Nhảy Tanh Tách', priceXu: 65, count: 5, tier: 2, icon: '🦐' },
  { id: 'bait_magic', name: 'Mồi Thính Gia Truyền', priceXu: 180, count: 3, tier: 3, icon: '🔮' },
  { id: 'bait_legend', name: 'Mồi Thần Lôi Ngự', priceXu: 500, count: 2, tier: 4, icon: '✨' },
];

export const ALL_CONSUMABLES = [
  { id: 'feed_chicken', name: 'Thóc Cám Cho Gà', energyRestore: 0, priceXu: 20, icon: '🌾', description: 'Thức ăn giúp gà đẻ trứng sau 60s' },
  { id: 'feed_pig', name: 'Cám Heo Đậm Đặc', energyRestore: 0, priceXu: 50, icon: '🥣', description: 'Thức ăn giúp heo mau lớn sau 150s' },
  { id: 'drink_lemon', name: 'Trà Chanh Vỉa Hè', energyRestore: 25, priceXu: 150, icon: '🍋', description: 'Hồi phục +25 Thể Lực' },
  { id: 'drink_coffee', name: 'Cà Phê Phin Sữa Đá', energyRestore: 60, priceXu: 350, icon: '☕', description: 'Hồi phục +60 Thể Lực' },
  { id: 'drink_energy', name: 'Nước Tăng Lực Bò Húc', energyRestore: 120, priceXu: 700, icon: '⚡', description: 'Hồi phục đầy 100% Thể Lực' },
  { id: 'fert_organic', name: 'Phân Hữu Cơ', speedPercent: 25, priceXu: 200, icon: '🧪', description: 'Rút ngắn 25% thời gian cây lớn' },
  { id: 'fert_bio', name: 'Phân Vi Sinh Siêu Cấp', speedPercent: 50, priceXu: 450, icon: '🧪', description: 'Rút ngắn 50% thời gian cây lớn' },
  { id: 'fert_magic', name: 'Phân Bón Thần Kỳ', speedPercent: 100, priceXu: 1200, icon: '✨', description: 'Cây trồng chín tức thì!' },
];

export const ALL_HOUSES = [
  { id: 'house_leaf', name: 'Nhà Tranh Mái Lá', priceXu: 0, priceLuong: 0, maxEnergy: 100, energyBonusSpeed: 1, icon: '🏠', description: 'Căn nhà lá đơn sơ ban đầu' },
  { id: 'house_tile', name: 'Nhà Ngói Ba Gian Sân Vườn', priceXu: 25000, priceLuong: 0, maxEnergy: 130, energyBonusSpeed: 1.3, icon: '🏡', description: 'Nhà ngói mát mẻ, tăng Max Energy lên 130' },
  { id: 'house_town', name: 'Nhà Phố 2 Tầng Hiện Đại', priceXu: 80000, priceLuong: 15, maxEnergy: 160, energyBonusSpeed: 1.6, icon: '🏘️', description: 'Nhà phố sang trọng, tăng Max Energy lên 160' },
  { id: 'house_villa', name: 'Biệt Thự Vườn Avatar', priceXu: 250000, priceLuong: 50, maxEnergy: 200, energyBonusSpeed: 2.0, icon: '🏰', description: 'Có hồ bơi và gara đỗ siêu xe, Max Energy 200' },
  { id: 'house_castle', name: 'Lâu Đài Hoàng Gia Kim Cương', priceXu: 1000000, priceLuong: 200, maxEnergy: 300, energyBonusSpeed: 3.0, icon: '🏯', description: 'Biểu tượng tối thượng của Đại Gia, Max Energy 300' },
];

export const ALL_VEHICLES = [
  { id: 'veh_bicycle', name: 'Xe Đạp Phượng Hoàng', priceXu: 2000, priceLuong: 0, speedBonus: 20, icon: '🚲', description: 'Tăng 20% tốc độ chạy' },
  { id: 'veh_cub50', name: 'Xe Cub 50cc Huyền Thoại', priceXu: 8000, priceLuong: 0, speedBonus: 40, icon: '🛵', description: 'Tăng 40% tốc độ, có khói pô pixel' },
  { id: 'veh_sh', name: 'Xe SH Ý / Vespa Sang Chảnh', priceXu: 35000, priceLuong: 10, speedBonus: 65, icon: '🏍️', description: 'Tăng 65% tốc độ' },
  { id: 'veh_supercar', name: 'Siêu Xe Mui Trần Pixel Lambo', priceXu: 150000, priceLuong: 50, speedBonus: 100, icon: '🏎️', description: 'Tăng 100% tốc độ, vệt sáng bánh xe' },
  { id: 'veh_ufo', name: 'Phi Thuyền Không Gian UFO', priceXu: 500000, priceLuong: 100, speedBonus: 140, icon: '🛸', description: 'Bay lơ lửng, hào quang ngoài hành tinh' },
  { id: 'veh_pegasus', name: 'Ngựa Bạch Mã Thần Thoại', priceXu: 300000, priceLuong: 80, speedBonus: 120, icon: '🐎', description: 'Vó ngựa phát hào quang hoàng gia' },
];

// ==========================================
// 2. CÁC HÀM XỬ LÝ HÀNH ĐỘNG GAME (SERVER-AUTHORITATIVE)
// ==========================================

/**
 * Mua vật phẩm từ Shop NPC
 */
export function handleBuyShopItem(userId, itemId, count = 1) {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'Không tìm thấy người chơi.' };

  // Tìm trong danh mục
  let itemDef = ALL_CROPS.find(c => c.id === itemId) || 
                ALL_BAITS.find(b => b.id === itemId) || 
                ALL_FISHING_RODS.find(r => r.id === itemId) || 
                ALL_CONSUMABLES.find(c => c.id === itemId);

  if (!itemDef) return { success: false, error: 'Vật phẩm không tồn tại.' };

  const priceXu = (itemDef.seedPrice || itemDef.priceXu || 0) * count;
  const priceLuong = (itemDef.priceLuong || 0) * count;

  if (user.xu < priceXu || user.luong < priceLuong) {
    return { success: false, error: 'Bạn không đủ Xu hoặc Lượng để mua.' };
  }

  // Trừ tiền
  updateUserBalance(userId, -priceXu, -priceLuong);

  // Thêm vào inventory
  const inventory = [...user.inventory];
  const itemType = itemDef.seedName ? 'seed' : (itemDef.energyRestore || itemDef.speedPercent ? 'consumable' : (itemDef.durability ? 'rod' : 'bait'));
  const targetId = itemDef.seedName ? `seed_${itemDef.id}` : itemDef.id;
  const targetName = itemDef.seedName || itemDef.name;
  const targetIcon = itemDef.seedIcon || itemDef.icon;

  const existing = inventory.find(i => i.id === targetId);
  if (existing) {
    existing.count += (itemDef.count ? itemDef.count * count : count);
  } else {
    inventory.push({
      id: targetId,
      name: targetName,
      type: itemType,
      count: itemDef.count ? itemDef.count * count : count,
      sellPrice: Math.floor((itemDef.seedPrice || itemDef.priceXu || 10) * 0.4),
      icon: targetIcon,
      description: itemDef.description || targetName,
    });
  }

  saveUserProfile(userId, { inventory });
  return { success: true, user: getUserById(userId), message: `Mua thành công ${count}x ${targetName}!` };
}

/**
 * Bán vật phẩm trong túi đồ cho NPC Thương Lái
 */
export function handleSellInventoryItem(userId, itemId, count = 1) {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'Không tìm thấy người chơi.' };

  const inventory = [...user.inventory];
  const itemIndex = inventory.findIndex(i => i.id === itemId);
  if (itemIndex === -1 || inventory[itemIndex].count < count) {
    return { success: false, error: 'Bạn không có đủ số lượng vật phẩm này để bán.' };
  }

  const item = inventory[itemIndex];
  const earnedXu = (item.sellPrice || 10) * count;

  item.count -= count;
  if (item.count <= 0) {
    inventory.splice(itemIndex, 1);
  }

  updateUserBalance(userId, earnedXu, 0);
  saveUserProfile(userId, { inventory });

  // Cập nhật nhiệm vụ bán hàng
  updateQuestProgress(userId, 'sell_items', earnedXu);

  return { success: true, user: getUserById(userId), earnedXu, message: `Bán thành công nhận được +${earnedXu.toLocaleString()} Xu!` };
}

/**
 * Gieo hạt giống vào ô đất
 */
export function handlePlantCrop(userId, plotId, cropId) {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'Không tìm thấy người chơi.' };

  // Kiểm tra năng lượng (Tốn 2 Energy)
  if (user.energy < 2) return { success: false, error: 'Bạn đã kiệt sức! Hãy uống nước hoặc ngủ để hồi năng lượng.' };

  const seedId = `seed_${cropId}`;
  const inventory = [...user.inventory];
  const seedIndex = inventory.findIndex(i => i.id === seedId);

  if (seedIndex === -1 || inventory[seedIndex].count <= 0) {
    return { success: false, error: 'Bạn không có hạt giống này trong túi đồ.' };
  }

  const farmPlots = [...user.farmPlots];
  const plot = farmPlots.find(p => p.id === plotId);
  if (!plot) return { success: false, error: 'Ô đất không tồn tại.' };
  if (plot.cropId) return { success: false, error: 'Ô đất này đã có cây trồng.' };

  // Trừ hạt giống và gieo cây
  inventory[seedIndex].count -= 1;
  if (inventory[seedIndex].count <= 0) inventory.splice(seedIndex, 1);

  plot.cropId = cropId;
  plot.plantedAt = Date.now();
  plot.watered = false;
  plot.fertilized = false;
  plot.hasPest = false;

  saveUserProfile(userId, {
    farmPlots,
    inventory,
    energy: Math.max(0, user.energy - 2),
  });

  return { success: true, user: getUserById(userId), message: 'Gieo hạt thành công!' };
}

/**
 * Thu hoạch nông sản
 */
export function handleHarvestCrop(userId, plotId) {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'Không tìm thấy người chơi.' };

  const farmPlots = [...user.farmPlots];
  const plot = farmPlots.find(p => p.id === plotId);
  if (!plot || !plot.cropId || !plot.plantedAt) {
    return { success: false, error: 'Ô đất không có cây trồng.' };
  }

  const cropDef = ALL_CROPS.find(c => c.id === plot.cropId);
  if (!cropDef) return { success: false, error: 'Cây trồng không hợp lệ.' };

  const growDurationMs = (cropDef.growDuration || 20) * 1000;
  const isMature = (Date.now() - plot.plantedAt) >= growDurationMs;

  if (!isMature) {
    const remainingSec = Math.ceil((growDurationMs - (Date.now() - plot.plantedAt)) / 1000);
    return { success: false, error: `Cây chưa chín! Còn lại ${remainingSec} giây.` };
  }

  // Thu hoạch
  const inventory = [...user.inventory];
  const existingCrop = inventory.find(i => i.id === cropDef.id);
  if (existingCrop) {
    existingCrop.count += 1;
  } else {
    inventory.push({
      id: cropDef.id,
      name: cropDef.name,
      type: 'crop',
      count: 1,
      sellPrice: cropDef.sellPrice,
      icon: cropDef.icon,
      description: `Nông sản tươi ngon thu hoạch từ nông trại.`,
    });
  }

  plot.cropId = null;
  plot.plantedAt = null;
  plot.watered = false;
  plot.fertilized = false;

  const newExp = user.exp + cropDef.expReward;
  const maxExp = user.level * 150;
  let level = user.level;
  let currentExp = newExp;
  if (currentExp >= maxExp) {
    level += 1;
    currentExp -= maxExp;
  }

  saveUserProfile(userId, {
    farmPlots,
    inventory,
    level,
    exp: currentExp,
    energy: Math.max(0, user.energy - 1),
  });

  // Cập nhật nhiệm vụ thu hoạch
  updateQuestProgress(userId, 'harvest', 1);

  return { success: true, user: getUserById(userId), message: `Thu hoạch thành công 1x ${cropDef.name}! (+${cropDef.expReward} EXP)` };
}

/**
 * Câu cá với tính toán tỷ lệ may mắn
 */
export function handleCatchFish(userId, rodId = 'rod_bamboo', baitId = 'bait_worm') {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'Không tìm thấy người chơi.' };

  if (user.energy < 3) return { success: false, error: 'Bạn đã kiệt sức! Hãy nghỉ ngơi hoặc uống nước.' };

  // Trừ mồi
  const inventory = [...user.inventory];
  const baitIndex = inventory.findIndex(i => i.id === baitId);
  if (baitIndex === -1 || inventory[baitIndex].count <= 0) {
    return { success: false, error: 'Bạn đã hết mồi câu này.' };
  }
  inventory[baitIndex].count -= 1;
  if (inventory[baitIndex].count <= 0) inventory.splice(baitIndex, 1);

  // Tính toán may mắn
  const rodDef = ALL_FISHING_RODS.find(r => r.id === rodId) || ALL_FISHING_RODS[0];
  const baitDef = ALL_BAITS.find(b => b.id === baitId) || ALL_BAITS[0];
  const luck = (rodDef.luckBonus || 0) + (baitDef.tier * 20);

  // Chọn cá ngẫu nhiên theo tier
  const roll = Math.random() * 100 + luck;
  let pool = ALL_FISH.filter(f => f.rarity === 'common');
  if (roll > 160 && baitDef.tier >= 3) {
    pool = ALL_FISH.filter(f => f.rarity === 'legendary');
  } else if (roll > 90) {
    pool = ALL_FISH.filter(f => f.rarity === 'epic' || f.rarity === 'rare');
  } else if (roll > 40) {
    pool = ALL_FISH.filter(f => f.rarity === 'rare');
  }

  const caughtFish = pool[Math.floor(Math.random() * pool.length)] || ALL_FISH[0];

  // Thêm cá vào túi đồ
  const existingFish = inventory.find(i => i.id === caughtFish.id);
  if (existingFish) {
    existingFish.count += 1;
  } else {
    inventory.push({
      id: caughtFish.id,
      name: caughtFish.name,
      type: 'fish',
      count: 1,
      sellPrice: caughtFish.sellPrice,
      icon: caughtFish.icon,
      description: `Phẩm chất: ${caughtFish.rarity.toUpperCase()}`,
    });
  }

  // Cộng Exp
  const newExp = user.exp + caughtFish.expReward;
  const maxExp = user.level * 150;
  let level = user.level;
  let currentExp = newExp;
  if (currentExp >= maxExp) {
    level += 1;
    currentExp -= maxExp;
  }

  saveUserProfile(userId, {
    inventory,
    level,
    exp: currentExp,
    energy: Math.max(0, user.energy - 3),
  });

  // Cập nhật nhiệm vụ câu cá
  updateQuestProgress(userId, 'fish', 1);

  return { success: true, user: getUserById(userId), fish: caughtFish, message: `Giật cần thành công: ${caughtFish.name}! (+${caughtFish.expReward} EXP)` };
}

/**
 * Mua và Nâng Cấp Bất Động Sản Nhà Ở
 */
export function handleBuyHouse(userId, houseId) {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'Không tìm thấy người chơi.' };

  const houseDef = ALL_HOUSES.find(h => h.id === houseId);
  if (!houseDef) return { success: false, error: 'Ngôi nhà không tồn tại.' };

  const houses = user.houses || ['house_leaf'];
  if (houses.includes(houseId)) {
    return { success: false, error: 'Bạn đã sở hữu ngôi nhà này rồi.' };
  }

  if (user.xu < houseDef.priceXu || user.luong < houseDef.priceLuong) {
    return { success: false, error: 'Bạn không đủ Xu hoặc Lượng để mua nhà này.' };
  }

  updateUserBalance(userId, -houseDef.priceXu, -houseDef.priceLuong);

  houses.push(houseId);
  saveUserProfile(userId, {
    houses,
    equippedHouseId: houseId,
    maxEnergy: houseDef.maxEnergy,
  });

  return { success: true, user: getUserById(userId), message: `Chúc mừng bạn đã sở hữu ${houseDef.name}! Max Energy tăng lên ${houseDef.maxEnergy}.` };
}

/**
 * Mua Xe Cộ / Thú Cưỡi
 */
export function handleBuyVehicle(userId, vehicleId) {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'Không tìm thấy người chơi.' };

  const vehDef = ALL_VEHICLES.find(v => v.id === vehicleId);
  if (!vehDef) return { success: false, error: 'Xe không tồn tại.' };

  const vehicles = user.vehicles || [];
  if (vehicles.includes(vehicleId)) {
    return { success: false, error: 'Bạn đã sở hữu phương tiện này rồi.' };
  }

  if (user.xu < vehDef.priceXu || user.luong < vehDef.priceLuong) {
    return { success: false, error: 'Bạn không đủ Xu hoặc Lượng để mua xe này.' };
  }

  updateUserBalance(userId, -vehDef.priceXu, -vehDef.priceLuong);

  vehicles.push(vehicleId);
  saveUserProfile(userId, {
    vehicles,
    equippedVehicleId: vehicleId,
  });

  return { success: true, user: getUserById(userId), message: `Chúc mừng bạn đã sở hữu ${vehDef.name}!` };
}

/**
 * Mua Con Giống Chăn Nuôi (Gà con, Heo con)
 */
export function handleBuyAnimal(userId, animalType) {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'Không tìm thấy người chơi.' };

  const chickens = user.chickens || [];
  const pigs = user.pigs || [];

  if (animalType === 'chicken') {
    if (chickens.length >= 4) {
      return { success: false, error: 'Chuồng gà đã đầy (tối đa 4 con)!' };
    }
    const cost = 300;
    if (user.xu < cost) {
      return { success: false, error: `Bạn cần ${cost} Xu để mua Gà con.` };
    }

    updateUserBalance(userId, -cost, 0);
    const newChicken = {
      id: Date.now(),
      fed: false,
      eggsReady: false,
      fedAt: 0,
      readyAt: 0
    };
    chickens.push(newChicken);
    saveUserProfile(userId, { chickens });
    return { success: true, user: getUserById(userId), message: 'Mua thành công 1 Gà con vào chuồng!' };
  } else if (animalType === 'pig') {
    if (pigs.length >= 4) {
      return { success: false, error: 'Chuồng heo đã đầy (tối đa 4 con)!' };
    }
    const cost = 1200;
    if (user.xu < cost) {
      return { success: false, error: `Bạn cần ${cost} Xu để mua Heo con.` };
    }

    updateUserBalance(userId, -cost, 0);
    const newPig = {
      id: Date.now(),
      fed: false,
      productReady: false,
      fedAt: 0,
      readyAt: 0
    };
    pigs.push(newPig);
    saveUserProfile(userId, { pigs });
    return { success: true, user: getUserById(userId), message: 'Mua thành công 1 Heo con vào chuồng!' };
  }

  return { success: false, error: 'Loại con giống không hợp lệ.' };
}

/**
 * Cho Vật Nuôi Ăn (Gà: 60s đẻ trứng, Heo: 150s lớn)
 */
export function handleFeedAnimal(userId, animalType, animalId) {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'Không tìm thấy người chơi.' };

  const inventory = [...user.inventory];

  if (animalType === 'chicken') {
    const chickens = user.chickens || [];
    const chicken = chickens.find(c => c.id === animalId);
    if (!chicken) return { success: false, error: 'Không tìm thấy con gà này.' };
    if (chicken.fed) return { success: false, error: 'Gà đang no và đang tiêu hóa thức ăn!' };

    // Kiểm tra có cám gà không
    const feedItem = inventory.find(i => i.id === 'feed_chicken' && i.count > 0);
    if (!feedItem) {
      if (user.xu < 20) {
        return { success: false, error: 'Bạn không có Thóc Cho Gà và không đủ 20 Xu để mua!' };
      }
      updateUserBalance(userId, -20, 0);
    } else {
      feedItem.count -= 1;
      if (feedItem.count <= 0) {
        const idx = inventory.findIndex(i => i.id === 'feed_chicken');
        if (idx !== -1) inventory.splice(idx, 1);
      }
    }

    const now = Date.now();
    chicken.fed = true;
    chicken.fedAt = now;
    chicken.readyAt = now + 60000; // 60s
    chicken.eggsReady = false;

    saveUserProfile(userId, { chickens, inventory });
    return { success: true, user: getUserById(userId), message: 'Đã rắc thóc cho gà! Gà sẽ đẻ trứng sau 60 giây.' };

  } else if (animalType === 'pig') {
    const pigs = user.pigs || [];
    const pig = pigs.find(p => p.id === animalId);
    if (!pig) return { success: false, error: 'Không tìm thấy con heo này.' };
    if (pig.fed) return { success: false, error: 'Heo đang no và đang lớn!' };

    // Kiểm tra có cám heo không
    const feedItem = inventory.find(i => i.id === 'feed_pig' && i.count > 0);
    if (!feedItem) {
      if (user.xu < 50) {
        return { success: false, error: 'Bạn không có Cám Heo và không đủ 50 Xu để mua!' };
      }
      updateUserBalance(userId, -50, 0);
    } else {
      feedItem.count -= 1;
      if (feedItem.count <= 0) {
        const idx = inventory.findIndex(i => i.id === 'feed_pig');
        if (idx !== -1) inventory.splice(idx, 1);
      }
    }

    const now = Date.now();
    pig.fed = true;
    pig.fedAt = now;
    pig.readyAt = now + 150000; // 150s (2.5 phút)
    pig.productReady = false;

    saveUserProfile(userId, { pigs, inventory });
    return { success: true, user: getUserById(userId), message: 'Đã đổ máng cám cho heo! Heo sẽ lớn sau 2.5 phút.' };
  }

  return { success: false, error: 'Loại vật nuôi không hợp lệ.' };
}

/**
 * Thu Hoạch Sản Phẩm Chăn Nuôi (Trứng Gà, Thịt Heo)
 */
export function handleCollectAnimalProduct(userId, animalType, animalId) {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'Không tìm thấy người chơi.' };

  const inventory = [...user.inventory];

  if (animalType === 'chicken') {
    const chickens = user.chickens || [];
    const chicken = chickens.find(c => c.id === animalId);
    if (!chicken) return { success: false, error: 'Không tìm thấy gà.' };

    const isReady = chicken.fed && (chicken.eggsReady || (chicken.readyAt && Date.now() >= chicken.readyAt));
    if (!isReady) {
      const remainingSec = chicken.readyAt ? Math.max(0, Math.ceil((chicken.readyAt - Date.now()) / 1000)) : 60;
      return { success: false, error: `Gà chưa đẻ trứng! Còn lại ${remainingSec}s.` };
    }

    // Tỷ lệ 15% ra trứng vàng
    const isGolden = Math.random() < 0.15;
    const targetId = isGolden ? 'egg_golden' : 'egg_fresh';
    const targetName = isGolden ? 'Trứng Gà Vàng Quý Tộc' : 'Trứng Gà Tươi';
    const sellPrice = isGolden ? 250 : 85;
    const expReward = isGolden ? 45 : 15;
    const icon = isGolden ? '🌟' : '🥚';

    const existing = inventory.find(i => i.id === targetId);
    if (existing) {
      existing.count += 1;
    } else {
      inventory.push({
        id: targetId,
        name: targetName,
        type: 'egg',
        count: 1,
        sellPrice,
        icon,
        description: `Trứng gà thơm ngon từ chuồng trại, bán được ${sellPrice} Xu.`
      });
    }

    chicken.fed = false;
    chicken.eggsReady = false;
    chicken.fedAt = 0;
    chicken.readyAt = 0;

    const newExp = user.exp + expReward;
    saveUserProfile(userId, { chickens, inventory, exp: newExp });
    updateQuestProgress(userId, 'chicken', 1);

    return { success: true, user: getUserById(userId), message: `Nhặt được 1x ${targetName}! (+${expReward} EXP)` };

  } else if (animalType === 'pig') {
    const pigs = user.pigs || [];
    const pig = pigs.find(p => p.id === animalId);
    if (!pig) return { success: false, error: 'Không tìm thấy heo.' };

    const isReady = pig.fed && (pig.productReady || (pig.readyAt && Date.now() >= pig.readyAt));
    if (!isReady) {
      const remainingSec = pig.readyAt ? Math.max(0, Math.ceil((pig.readyAt - Date.now()) / 1000)) : 150;
      return { success: false, error: `Heo chưa lớn! Còn lại ${remainingSec}s.` };
    }

    const targetId = 'pork_fresh';
    const targetName = 'Thịt Heo Tươi Sạch';
    const sellPrice = 350;
    const expReward = 40;

    const existing = inventory.find(i => i.id === targetId);
    if (existing) {
      existing.count += 1;
    } else {
      inventory.push({
        id: targetId,
        name: targetName,
        type: 'crop',
        count: 1,
        sellPrice,
        icon: '🥩',
        description: `Thịt heo chất lượng cao xuất chuồng, bán được ${sellPrice} Xu.`
      });
    }

    pig.fed = false;
    pig.productReady = false;
    pig.fedAt = 0;
    pig.readyAt = 0;

    const newExp = user.exp + expReward;
    saveUserProfile(userId, { pigs, inventory, exp: newExp });

    return { success: true, user: getUserById(userId), message: `Thu hoạch thành công 1x ${targetName}! (+${expReward} EXP)` };
  }

  return { success: false, error: 'Loại vật nuôi không hợp lệ.' };
}
