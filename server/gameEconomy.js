import { db } from './db.js';
import { getUserById, saveUserProfile, updateUserBalance } from './keyManager.js';
import { updateQuestProgress } from './questEngine.js';

// ==========================================
// 1. DANH MỤC 50+ VẬT PHẨM TOÀN DIỆN
// ==========================================

export const ALL_CROPS = [
  // Cây ngắn ngày
  { id: 'rice', name: 'Lúa Nước', seedName: 'Hạt Giống Lúa', growDuration: 12, seedPrice: 20, sellPrice: 50, expReward: 10, icon: '🌾', seedIcon: '🌱', levelRequired: 1 },
  { id: 'carrot', name: 'Cà Rốt Đỏ', seedName: 'Hạt Cà Rốt', growDuration: 20, seedPrice: 45, sellPrice: 115, expReward: 20, icon: '🥕', seedIcon: '🌱', levelRequired: 1 },
  { id: 'corn', name: 'Bắp Ngô Vàng', seedName: 'Hạt Bắp Ngô', growDuration: 28, seedPrice: 65, sellPrice: 170, expReward: 30, icon: '🌽', seedIcon: '🌱', levelRequired: 2 },
  { id: 'tomato', name: 'Cà Chua Bi', seedName: 'Hạt Cà Chua', growDuration: 35, seedPrice: 85, sellPrice: 230, expReward: 40, icon: '🍅', seedIcon: '🌱', levelRequired: 2 },
  { id: 'potato', name: 'Khoai Lang Mật', seedName: 'Củ Khoai Giống', growDuration: 45, seedPrice: 110, sellPrice: 300, expReward: 50, icon: '🥔', seedIcon: '🌱', levelRequired: 3 },
  // Hoa cảnh khoe sắc
  { id: 'marigold', name: 'Hoa Cúc Vàng', seedName: 'Hạt Cúc Vàng', growDuration: 55, seedPrice: 140, sellPrice: 390, expReward: 65, icon: '🌼', seedIcon: '🌱', levelRequired: 3 },
  { id: 'rose', name: 'Hoa Hồng Đỏ', seedName: 'Hạt Hoa Hồng', growDuration: 65, seedPrice: 180, sellPrice: 520, expReward: 85, icon: '🌹', seedIcon: '🌱', levelRequired: 4 },
  { id: 'sunflower', name: 'Hoa Hướng Dương', seedName: 'Hạt Hướng Dương', growDuration: 75, seedPrice: 230, sellPrice: 680, expReward: 110, icon: '🌻', seedIcon: '🌱', levelRequired: 4 },
  { id: 'lotus', name: 'Hoa Sen Ngọc', seedName: 'Củ Sen Ngọc', growDuration: 90, seedPrice: 320, sellPrice: 960, expReward: 150, icon: '🪷', seedIcon: '✨', levelRequired: 5 },
  { id: 'orchid', name: 'Hoa Lan Quý Tộc', seedName: 'Mầm Lan Rừng', growDuration: 110, seedPrice: 450, sellPrice: 1400, expReward: 200, icon: '🌸', seedIcon: '✨', levelRequired: 6 },
  // Trái cây cao cấp
  { id: 'watermelon', name: 'Dưa Hấu Đỏ', seedName: 'Hạt Dưa Hấu', growDuration: 120, seedPrice: 550, sellPrice: 1800, expReward: 250, icon: '🍉', seedIcon: '🌱', levelRequired: 6 },
  { id: 'dragonfruit', name: 'Thanh Long Ruột Đỏ', seedName: 'Nhánh Thanh Long', growDuration: 140, seedPrice: 700, sellPrice: 2300, expReward: 320, icon: '🐉', seedIcon: '🌱', levelRequired: 7 },
  { id: 'grape', name: 'Nho Tím Ninh Thuận', seedName: 'Giống Nho Tím', growDuration: 160, seedPrice: 900, sellPrice: 3000, expReward: 400, icon: '🍇', seedIcon: '🌱', levelRequired: 8 },
  { id: 'strawberry', name: 'Dâu Tây Hoàng Gia', seedName: 'Hạt Dâu Tây Vàng', growDuration: 180, seedPrice: 1200, sellPrice: 4200, expReward: 550, icon: '🍓', seedIcon: '✨', levelRequired: 9 },
  { id: 'golden_apple', name: 'Táo Vàng Thần Thoại', seedName: 'Mầm Cây Thần', growDuration: 240, seedPrice: 2500, sellPrice: 9000, expReward: 1000, icon: '🍎', seedIcon: '🌟', levelRequired: 10 },
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
