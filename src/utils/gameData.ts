import { CropDefinition, FishDefinition, FishingRod, BaitDefinition, DailyQuest, UserProfile, SoilPlot } from '../types';

export const CROPS: CropDefinition[] = [
  // Cây ngắn ngày
  { id: 'rice', name: 'Lúa Nước', seedName: 'Hạt Giống Lúa', growDuration: 30, seedPrice: 20, sellPrice: 55, expReward: 10, icon: '🌾', seedIcon: '🌱', description: 'Đặc sản đồng quê Avatar lớn trong 30s.', levelRequired: 1 },
  { id: 'carrot', name: 'Cà Rốt Đỏ', seedName: 'Hạt Cà Rốt', growDuration: 60, seedPrice: 45, sellPrice: 120, expReward: 20, icon: '🥕', seedIcon: '🌱', description: 'Cà rốt giòn ngọt lớn trong 1 phút.', levelRequired: 1 },
  { id: 'corn', name: 'Bắp Ngô Vàng', seedName: 'Hạt Bắp Ngô', growDuration: 90, seedPrice: 65, sellPrice: 180, expReward: 30, icon: '🌽', seedIcon: '🌱', description: 'Bắp ngô vàng óng ả lớn trong 1.5 phút.', levelRequired: 2 },
  { id: 'tomato', name: 'Cà Chua Bi', seedName: 'Hạt Cà Chua', growDuration: 120, seedPrice: 85, sellPrice: 240, expReward: 40, icon: '🍅', seedIcon: '🌱', description: 'Chùm cà chua mọng nước lớn trong 2 phút.', levelRequired: 2 },
  { id: 'potato', name: 'Khoai Lang Mật', seedName: 'Củ Khoai Giống', growDuration: 150, seedPrice: 110, sellPrice: 320, expReward: 50, icon: '🥔', seedIcon: '🌱', description: 'Khoai lang dẻo thơm lớn trong 2.5 phút.', levelRequired: 3 },
  // Hoa cảnh
  { id: 'marigold', name: 'Hoa Cúc Vàng', seedName: 'Hạt Cúc Vàng', growDuration: 180, seedPrice: 140, sellPrice: 420, expReward: 65, icon: '🌼', seedIcon: '🌱', description: 'Bông cúc vàng rực rỡ nở sau 3 phút.', levelRequired: 3 },
  { id: 'rose', name: 'Hoa Hồng Đỏ', seedName: 'Hạt Hoa Hồng', growDuration: 240, seedPrice: 180, sellPrice: 560, expReward: 85, icon: '🌹', seedIcon: '🌱', description: 'Bông hồng kiêu sa nở sau 4 phút.', levelRequired: 4 },
  { id: 'sunflower', name: 'Hoa Hướng Dương', seedName: 'Hạt Hướng Dương', growDuration: 300, seedPrice: 230, sellPrice: 720, expReward: 110, icon: '🌻', seedIcon: '🌱', description: 'Hoa hướng dương khoe sắc sau 5 phút.', levelRequired: 4 },
  { id: 'lotus', name: 'Hoa Sen Ngọc', seedName: 'Củ Sen Ngọc', growDuration: 360, seedPrice: 320, sellPrice: 1000, expReward: 150, icon: '🪷', seedIcon: '✨', description: 'Quốc hoa ngát hương nở sau 6 phút.', levelRequired: 5 },
  { id: 'orchid', name: 'Hoa Lan Quý Tộc', seedName: 'Mầm Lan Rừng', growDuration: 450, seedPrice: 450, sellPrice: 1500, expReward: 200, icon: '🌸', seedIcon: '✨', description: 'Hoa lan rừng quý hiếm nở sau 7.5 phút.', levelRequired: 6 },
  // Trái cây cao cấp
  { id: 'watermelon', name: 'Dưa Hấu Đỏ', seedName: 'Hạt Dưa Hấu', growDuration: 600, seedPrice: 550, sellPrice: 1900, expReward: 250, icon: '🍉', seedIcon: '🌱', description: 'Trái dưa hấu đỏ chín mọng sau 10 phút.', levelRequired: 6 },
  { id: 'dragonfruit', name: 'Thanh Long Ruột Đỏ', seedName: 'Nhánh Thanh Long', growDuration: 750, seedPrice: 700, sellPrice: 2500, expReward: 320, icon: '🐉', seedIcon: '🌱', description: 'Thanh long ngọt lịm thu hoạch sau 12.5 phút.', levelRequired: 7 },
  { id: 'grape', name: 'Nho Tím Ninh Thuận', seedName: 'Giống Nho Tím', growDuration: 900, seedPrice: 900, sellPrice: 3200, expReward: 400, icon: '🍇', seedIcon: '🌱', description: 'Chùm nho mọng nước chín sau 15 phút.', levelRequired: 8 },
  { id: 'strawberry', name: 'Dâu Tây Hoàng Gia', seedName: 'Hạt Dâu Vàng', growDuration: 1200, seedPrice: 1200, sellPrice: 4500, expReward: 550, icon: '🍓', seedIcon: '✨', description: 'Dâu tây hoàng gia thu hoạch sau 20 phút.', levelRequired: 9 },
  { id: 'golden_apple', name: 'Táo Vàng Thần Thoại', seedName: 'Mầm Cây Thần', growDuration: 1800, seedPrice: 2500, sellPrice: 10000, expReward: 1000, icon: '🍎', seedIcon: '🌟', description: 'Trái cây thần tích chín sau 30 phút.', levelRequired: 10 },
];

export const FISH_SPECIES: FishDefinition[] = [
  // Cá đồng quê
  { id: 'fish_carp', name: 'Cá Rô Đồng', rarity: 'common', sellPrice: 65, expReward: 12, icon: '🐟', description: 'Cá rô đồng quen thuộc nhảy lách tách ven hồ.', difficulty: 1, minBaitLevel: 1 },
  { id: 'fish_goby', name: 'Cá Bống Dừa', rarity: 'common', sellPrice: 90, expReward: 18, icon: '🐟', description: 'Cá bống dừa béo ngậy.', difficulty: 1, minBaitLevel: 1 },
  { id: 'fish_gold', name: 'Cá Chép Vàng', rarity: 'common', sellPrice: 130, expReward: 25, icon: '🐠', description: 'Cá chép óng ánh mang lại may mắn.', difficulty: 2, minBaitLevel: 1 },
  { id: 'fish_catfish', name: 'Cá Trê Mun', rarity: 'common', sellPrice: 180, expReward: 35, icon: '🐡', description: 'Cá da trơn bơi khoẻ giật cần đã tay.', difficulty: 2, minBaitLevel: 1 },
  { id: 'fish_snakehead', name: 'Cá Lóc Đồng (Cá Quả)', rarity: 'rare', sellPrice: 280, expReward: 55, icon: '🐟', description: 'Cá lóc săn mồi đớp phao cực nhạy.', difficulty: 3, minBaitLevel: 1 },
  { id: 'fish_elephant_ear', name: 'Cá Tai Tượng', rarity: 'rare', sellPrice: 380, expReward: 75, icon: '🐠', description: 'Cá tai tượng vảy to.', difficulty: 3, minBaitLevel: 2 },
  // Thủy hải sản
  { id: 'fish_blue_shrimp', name: 'Tôm Càng Xanh', rarity: 'rare', sellPrice: 450, expReward: 90, icon: '🦐', description: 'Tôm càng xanh búng tanh tách.', difficulty: 3, minBaitLevel: 2 },
  { id: 'fish_mud_crab', name: 'Cua Biển Cà Mau', rarity: 'rare', sellPrice: 550, expReward: 110, icon: '🦀', description: 'Cua gạch đỏ au giương 2 càng oai vệ.', difficulty: 3, minBaitLevel: 2 },
  { id: 'fish_snail', name: 'Ốc Hương Hoa Sen', rarity: 'rare', sellPrice: 650, expReward: 130, icon: '🐚', description: 'Ốc hương thơm phức.', difficulty: 3, minBaitLevel: 2 },
  { id: 'fish_squid', name: 'Mực Ống Đại Dương', rarity: 'rare', sellPrice: 800, expReward: 160, icon: '🦑', description: 'Mực ống tươi rói.', difficulty: 3, minBaitLevel: 2 },
  // Hiếm & Huyền thoại
  { id: 'fish_clown', name: 'Cá Hề San Hô', rarity: 'epic', sellPrice: 1100, expReward: 220, icon: '🐠', description: 'Cá hề Nemo rực rỡ sắc màu.', difficulty: 4, minBaitLevel: 2 },
  { id: 'fish_seahorse', name: 'Cá Ngựa Vàng', rarity: 'epic', sellPrice: 1500, expReward: 300, icon: '🫧', description: 'Cá ngựa quý hiếm bơi uốn lượn.', difficulty: 4, minBaitLevel: 3 },
  { id: 'fish_ray', name: 'Cá Đuối Khổng Lồ', rarity: 'epic', sellPrice: 2200, expReward: 450, icon: '🦑', description: 'Cá đuối khổng lồ quẫy sóng mạnh.', difficulty: 4, minBaitLevel: 3 },
  { id: 'fish_shark', name: 'Cá Mập Cắn Cáp', rarity: 'epic', sellPrice: 3500, expReward: 700, icon: '🦈', description: 'Hung thần vùng nước sâu đổi được núi Xu.', difficulty: 4, minBaitLevel: 3 },
  { id: 'fish_dolphin', name: 'Cá Heo Bạch Tạng', rarity: 'legendary', sellPrice: 5500, expReward: 1100, icon: '🐬', description: 'Cá heo trắng thiên thần may mắn.', difficulty: 5, minBaitLevel: 3 },
  { id: 'fish_dragon', name: 'Cá Rồng Kim Long Thần Thoại', rarity: 'legendary', sellPrice: 10000, expReward: 2000, icon: '🐉', description: 'Huyền thoại hồ câu Avatar! Vảy vàng rực rỡ, biểu tượng đại gia.', difficulty: 5, minBaitLevel: 3 },
  { id: 'fish_golden_turtle', name: 'Rùa Vàng Nghìn Năm', rarity: 'legendary', sellPrice: 15000, expReward: 3000, icon: '🐢', description: 'Thần Kim Quy ngậm ngọc đem lại phúc lộc vô biên.', difficulty: 5, minBaitLevel: 3 },
];

export const FISHING_RODS: FishingRod[] = [
  { id: 'rod_bamboo', name: 'Cần Tre Đồng Quê', durability: 30, maxDurability: 30, luckBonus: 0, priceXu: 0, priceLuong: 0, icon: '🎋', description: 'Cần câu mộc mạc cấp ban đầu.' },
  { id: 'rod_lotus', name: 'Cần Trúc Sen Ngọc', durability: 60, maxDurability: 60, luckBonus: 20, priceXu: 1200, priceLuong: 0, icon: '🎣', description: 'Tăng 20% tỉ lệ bắt được cá hiếm.' },
  { id: 'rod_carbon', name: 'Cần Máy Carbon', durability: 120, maxDurability: 120, luckBonus: 45, priceXu: 3500, priceLuong: 8, icon: '⚡', description: 'Dây cước siêu bền, tăng 45% may mắn.' },
  { id: 'rod_gold', name: 'Cần Hoàng Kim Long', durability: 300, maxDurability: 300, luckBonus: 85, priceXu: 12000, priceLuong: 30, icon: '🌟', description: 'Phát sáng lấp lánh, tỷ lệ câu trúng Rồng Vàng cực cao!' },
  { id: 'rod_titan', name: 'Cần Titan Sấm Sét', durability: 800, maxDurability: 800, luckBonus: 150, priceXu: 35000, priceLuong: 80, icon: '🔱', description: 'Bảo vật của Vua Thủy Tề, giật cá huyền thoại dễ như trở bàn tay.' },
];

export const BAITS: BaitDefinition[] = [
  { id: 'bait_worm', name: 'Giun Đất Tươi', priceXu: 20, count: 5, tier: 1, icon: '🪱', description: 'Mồi câu bình dân cá rô cá chép rất thích.' },
  { id: 'bait_shrimp', name: 'Tôm Nhảy Tanh Tách', priceXu: 65, count: 5, tier: 2, icon: '🦐', description: 'Mồi tanh kích thích cá to đớp mạnh.' },
  { id: 'bait_magic', name: 'Mồi Thính Gia Truyền', priceXu: 180, count: 3, tier: 3, icon: '🔮', description: 'Bí truyền thu hút cá đuối, cá mập.' },
  { id: 'bait_legend', name: 'Mồi Thần Lôi Ngự', priceXu: 500, count: 2, tier: 4, icon: '✨', description: 'Tỏa hào quang dẫn dụ Cá Rồng và Rùa Vàng.' },
];

export const FASHION_SHOP_ITEMS = [
  { id: 'hat_straw', name: 'Nón Lá Nông Dân', type: 'hat' as const, priceXu: 300, priceLuong: 0, icon: '👒', value: 'straw', description: 'Nón lá truyền thống che mưa che nắng.' },
  { id: 'hat_cowboy', name: 'Mũ Cao Bồi Texas', type: 'hat' as const, priceXu: 900, priceLuong: 0, icon: '🤠', value: 'cowboy', description: 'Phong cách lãng tử miền tây.' },
  { id: 'hat_crown', name: 'Vương Miện Hoàng Gia', type: 'hat' as const, priceXu: 0, priceLuong: 25, icon: '👑', value: 'crown', description: 'Đính kim cương quý tộc đẳng cấp.' },
  { id: 'glasses_cool', name: 'Kính Râm Đen Ngầu', type: 'glasses' as const, priceXu: 450, priceLuong: 0, icon: '🕶️', value: 'black', description: 'Kính mát đen huyền thoại.' },
  { id: 'wings_angel', name: 'Cánh Thiên Thần Trắng', type: 'wings' as const, priceXu: 0, priceLuong: 40, icon: '🪽', value: 'angel', description: 'Đôi cánh thiên thần huyền ảo vỗ cánh bay bổng.' },
  { id: 'wings_demon', name: 'Cánh Ác Ma Lửa', type: 'wings' as const, priceXu: 0, priceLuong: 40, icon: '🦇', value: 'demon', description: 'Cánh dơi quỷ vương ma mị thể hiện đẳng cấp.' },
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

export const INITIAL_PLOTS: SoilPlot[] = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  cropId: null,
  plantedAt: null,
  watered: false,
  hasPest: false,
  fertilized: false,
}));

export const INITIAL_DAILY_QUESTS: DailyQuest[] = [
  { id: 'quest_harvest', title: 'Thu hoạch 6 luống nông sản', progress: 0, target: 6, rewardXu: 600, rewardExp: 80, completed: false, claimed: false, icon: '🌾' },
  { id: 'quest_fish', title: 'Câu thành công 3 con cá ở hồ', progress: 0, target: 3, rewardXu: 800, rewardExp: 100, completed: false, claimed: false, icon: '🎣' },
  { id: 'quest_baucua', title: 'Thử vận may 2 ván Bầu Cua', progress: 0, target: 2, rewardXu: 500, rewardExp: 60, completed: false, claimed: false, icon: '🎲' },
  { id: 'quest_sell', title: 'Bán nông sản hoặc cá thu về 1,000 Xu', progress: 0, target: 1000, rewardXu: 700, rewardExp: 90, completed: false, claimed: false, icon: '💰' },
  { id: 'quest_chicken', title: 'Thu thập 2 quả trứng gà trong chuồng', progress: 0, target: 2, rewardXu: 450, rewardExp: 50, completed: false, claimed: false, icon: '🥚' },
];

export const DEFAULT_USER: UserProfile = {
  id: 'user_avatar_default',
  username: 'NongDanChamChi',
  nickname: 'Cần Thủ Avatar',
  gender: 'male',
  level: 1,
  exp: 0,
  maxExp: 150,
  energy: 100,
  maxEnergy: 100,
  xu: 20000,
  luong: 20,
  equippedHouseId: 'house_leaf',
  equippedVehicleId: '',
  houses: ['house_leaf'],
  vehicles: [],
  appearance: {
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
  },
  farmPlots: INITIAL_PLOTS,
  chickens: [],
  pigs: [],
  inventory: [
    { id: 'seed_rice', name: 'Hạt Giống Lúa', type: 'seed', count: 10, sellPrice: 8, icon: '🌱', description: 'Gieo hạt trồng lúa nước' },
    { id: 'bait_worm', name: 'Giun Đất Tươi', type: 'bait', count: 10, sellPrice: 5, icon: '🪱', description: 'Mồi câu cá rô cá chép' },
  ],
  equippedRodId: 'rod_bamboo',
  equippedBaitId: 'bait_worm',
  currentArea: 'farm',
  stats: {
    cropsHarvested: 0,
    fishCaught: 0,
    miniGamesPlayed: 0,
    miniGamesWon: 0,
    moneyEarned: 0,
  },
  quests: INITIAL_DAILY_QUESTS,
  lastLogin: Date.now(),
};
