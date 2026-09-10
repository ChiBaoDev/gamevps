import React, { useState, useEffect } from 'react';
import { UserProfile, SoilPlot, CropDefinition } from '../types';
import { CROPS } from '../utils/gameData';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Droplets, 
  Sparkles, 
  Bug, 
  Clock, 
  Egg, 
  Wheat, 
  PlusCircle,
  TrendingUp,
  Flame,
  ShoppingBag,
  Heart
} from 'lucide-react';
import { CharacterSprite } from './CharacterSprite';

interface FarmAreaProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onShowMessage: (msg: string) => void;
}

export const FarmArea: React.FC<FarmAreaProps> = ({
  user,
  onUpdateUser,
  onShowMessage,
}) => {
  const [selectedPlot, setSelectedPlot] = useState<SoilPlot | null>(null);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [, setNow] = useState(Date.now());
  const [activeAction, setActiveAction] = useState<'idle' | 'watering' | 'harvesting'>('idle');
  const [animalTab, setAnimalTab] = useState<'chicken' | 'pig'>('chicken');

  // Timer to update crop & animal growth in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds to human readable string: "45s" or "2m 30s"
  const formatTimeLeft = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}p ${secs > 0 ? `${secs}s` : ''}`;
  };

  // Helper to get crop definition
  const getCropDef = (cropId: string | null): CropDefinition | undefined => {
    return CROPS.find((c) => c.id === cropId);
  };

  // Helper to get plot growth status
  const getPlotStatus = (plot: SoilPlot) => {
    if (!plot.cropId || !plot.plantedAt) return { stage: 'empty', progress: 0, timeLeft: 0, mature: false };
    const crop = getCropDef(plot.cropId);
    if (!crop) return { stage: 'empty', progress: 0, timeLeft: 0, mature: false };

    const duration = plot.fertilized ? crop.growDuration * 0.5 : crop.growDuration;
    const elapsedSeconds = (Date.now() - plot.plantedAt) / 1000;
    const progress = Math.min(100, (elapsedSeconds / duration) * 100);
    const mature = elapsedSeconds >= duration;
    const timeLeft = Math.max(0, Math.ceil(duration - elapsedSeconds));

    let stage = 'sprout';
    if (progress >= 100) stage = 'mature';
    else if (progress > 50) stage = 'growing';

    return { stage, progress, timeLeft, mature, crop };
  };

  // Action: Plant seed on plot
  const handlePlantSeed = (crop: CropDefinition) => {
    if (!selectedPlot) return;
    // Check if user has seed in inventory or enough Xu to buy
    const seedInventoryItem = user.inventory.find(
      (item) => item.type === 'seed' && (item.id === `seed_${crop.id}` || item.id === `${crop.id}_seed` || item.id === crop.id) && item.count > 0
    );

    if (!seedInventoryItem && user.xu < crop.seedPrice) {
      sounds.playClick();
      onShowMessage(`❌ Bạn không có hạt giống và không đủ ${crop.seedPrice} Xu để gieo!`);
      return;
    }

    sounds.playHarvest();
    const updatedPlots = user.farmPlots.map((p) => {
      if (p.id === selectedPlot.id) {
        return {
          ...p,
          cropId: crop.id,
          plantedAt: Date.now(),
          watered: true,
          hasPest: false,
          fertilized: false,
        };
      }
      return p;
    });

    let updatedInventory = [...user.inventory];
    let newXu = user.xu;

    if (seedInventoryItem) {
      updatedInventory = updatedInventory.map((item) => {
        if (item.id === seedInventoryItem.id) {
          return { ...item, count: item.count - 1 };
        }
        return item;
      }).filter((item) => item.count > 0);
    } else {
      newXu -= crop.seedPrice;
    }

    onUpdateUser({
      farmPlots: updatedPlots,
      inventory: updatedInventory,
      xu: newXu,
    });

    setShowSeedModal(false);
    setSelectedPlot(null);
    onShowMessage(`🌱 Đã gieo ${crop.name} (thời gian chín: ${formatTimeLeft(crop.growDuration)})!`);
  };

  // Action: Water a plot
  const handleWaterPlot = (plotId: number) => {
    sounds.playWater();
    setActiveAction('watering');
    setTimeout(() => setActiveAction('idle'), 800);

    const updatedPlots = user.farmPlots.map((p) => {
      if (p.id === plotId) {
        return { ...p, watered: true };
      }
      return p;
    });

    onUpdateUser({
      farmPlots: updatedPlots,
      energy: Math.max(0, user.energy - 1),
      exp: user.exp + 2,
    });
    onShowMessage('💧 Đã tưới nước mát cho cây!');
  };

  // Action: Remove pest from plot
  const handleRemovePest = (plotId: number) => {
    sounds.playHarvest();
    const updatedPlots = user.farmPlots.map((p) => {
      if (p.id === plotId) {
        return { ...p, hasPest: false };
      }
      return p;
    });

    onUpdateUser({
      farmPlots: updatedPlots,
      exp: user.exp + 5,
    });
    onShowMessage('🐛 Đã bắt sạch sâu bọ hại cây! Nhận +5 EXP.');
  };

  // Action: Fertilize plot
  const handleFertilizePlot = (plotId: number) => {
    const fertItem = user.inventory.find((item) => (item.id === 'fertilizer' || item.id === 'fert_organic' || item.id === 'fert_bio') && item.count > 0);
    if (!fertItem) {
      onShowMessage('❌ Bạn không có phân bón trong túi đồ!');
      return;
    }

    sounds.playHarvest();
    const updatedPlots = user.farmPlots.map((p) => {
      if (p.id === plotId) {
        return { ...p, fertilized: true, plantedAt: (p.plantedAt || Date.now()) - 20000 };
      }
      return p;
    });

    const updatedInv = user.inventory.map((item) => {
      if (item.id === fertItem.id) {
        return { ...item, count: item.count - 1 };
      }
      return item;
    }).filter((i) => i.count > 0);

    onUpdateUser({
      farmPlots: updatedPlots,
      inventory: updatedInv,
    });
    onShowMessage('✨ Đã bón phân kích thích! Thời gian thu hoạch được rút ngắn.');
  };

  // Action: Harvest crop
  const handleHarvestPlot = (plotId: number) => {
    const plot = user.farmPlots.find((p) => p.id === plotId);
    if (!plot || !plot.cropId) return;
    const crop = getCropDef(plot.cropId);
    if (!crop) return;

    sounds.playCoin();
    setActiveAction('harvesting');
    setTimeout(() => setActiveAction('idle'), 600);

    // Trigger visual confetti
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#facc15', '#22c55e', '#ef4444', '#3b82f6'],
      });
    } catch {}

    const updatedPlots = user.farmPlots.map((p) => {
      if (p.id === plotId) {
        return {
          ...p,
          cropId: null,
          plantedAt: null,
          watered: false,
          hasPest: false,
          fertilized: false,
        };
      }
      return p;
    });

    // Add harvested crop to inventory
    const existingCropIndex = user.inventory.findIndex((item) => item.id === crop.id || item.id === `crop_${crop.id}`);
    let updatedInventory = [...user.inventory];
    if (existingCropIndex >= 0) {
      updatedInventory[existingCropIndex].count += 1;
    } else {
      updatedInventory.push({
        id: crop.id,
        name: crop.name,
        type: 'crop',
        count: 1,
        sellPrice: crop.sellPrice,
        icon: crop.icon,
        description: `Nông sản tươi ngon thu hoạch từ nông trại, bán được ${crop.sellPrice} Xu.`,
      });
    }

    // Update quest progress
    const updatedQuests = user.quests.map((q) => {
      if (q.id === 'quest_harvest') {
        const newProg = Math.min(q.target, q.progress + 1);
        return { ...q, progress: newProg, completed: newProg >= q.target };
      }
      return q;
    });

    // Check level up
    let newExp = user.exp + crop.expReward;
    let newLevel = user.level;
    let newMaxExp = user.maxExp;
    let newLuong = user.luong;

    if (newExp >= user.maxExp) {
      newLevel += 1;
      newExp -= user.maxExp;
      newMaxExp = Math.round(newMaxExp * 1.5);
      newLuong += 2;
      sounds.playLevelUp();
      onShowMessage(`🎉 CHÚC MỪNG! Bạn đã thăng lên Cấp ${newLevel}! Nhận thưởng 2 LƯỢNG.`);
    } else {
      onShowMessage(`🌾 Thu hoạch thành công 1x ${crop.name}! (+${crop.expReward} EXP, giá bán ${crop.sellPrice} Xu).`);
    }

    onUpdateUser({
      farmPlots: updatedPlots,
      inventory: updatedInventory,
      exp: newExp,
      level: newLevel,
      maxExp: newMaxExp,
      luong: newLuong,
      quests: updatedQuests,
      stats: {
        ...user.stats,
        cropsHarvested: user.stats.cropsHarvested + 1,
      },
    });
  };

  // Harvest all mature crops at once
  const handleHarvestAll = () => {
    let totalHarvested = 0;
    let totalExpEarned = 0;
    let updatedPlots = [...user.farmPlots];
    let updatedInventory = [...user.inventory];

    user.farmPlots.forEach((plot) => {
      const status = getPlotStatus(plot);
      if (status.mature && status.crop) {
        totalHarvested++;
        totalExpEarned += status.crop.expReward;

        const existingCropIdx = updatedInventory.findIndex((i) => i.id === status.crop!.id || i.id === `crop_${status.crop!.id}`);
        if (existingCropIdx >= 0) {
          updatedInventory[existingCropIdx].count += 1;
        } else {
          updatedInventory.push({
            id: status.crop!.id,
            name: status.crop!.name,
            type: 'crop',
            count: 1,
            sellPrice: status.crop!.sellPrice,
            icon: status.crop!.icon,
            description: `Nông sản tươi ngon thu hoạch từ nông trại, bán được ${status.crop!.sellPrice} Xu.`,
          });
        }

        updatedPlots = updatedPlots.map((p) =>
          p.id === plot.id
            ? { ...p, cropId: null, plantedAt: null, watered: false, hasPest: false, fertilized: false }
            : p
        );
      }
    });

    if (totalHarvested === 0) {
      onShowMessage('Chưa có cây nào chín để thu hoạch!');
      return;
    }

    sounds.playCatchSuccess();
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {}

    onUpdateUser({
      farmPlots: updatedPlots,
      inventory: updatedInventory,
      exp: user.exp + totalExpEarned,
      stats: {
        ...user.stats,
        cropsHarvested: user.stats.cropsHarvested + totalHarvested,
      },
    });
    onShowMessage(`🌾 Đã gặt toàn bộ ${totalHarvested} luống cây! Nhận +${totalExpEarned} EXP.`);
  };

  // ==========================================
  // CHĂN NUÔI: GÀ 🐔 & HEO 🐷
  // ==========================================

  // Mua Con Giống (Gà con: 300 Xu, Heo con: 1200 Xu)
  const handleBuyAnimal = async (type: 'chicken' | 'pig') => {
    const cost = type === 'chicken' ? 300 : 1200;
    const name = type === 'chicken' ? 'Gà Con' : 'Heo Con';

    if (user.xu < cost) {
      sounds.playClick();
      onShowMessage(`❌ Bạn cần ${cost} Xu để mua 1 ${name}!`);
      return;
    }

    try {
      const token = localStorage.getItem('game_auth_token') || '';
      const res = await fetch('/api/game/animals/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ animalType: type })
      });
      const data = await res.json();
      if (data.success) {
        sounds.playCoin();
        onUpdateUser(data.user);
        onShowMessage(`🎉 ${data.message}`);
      } else {
        onShowMessage(`❌ ${data.error}`);
      }
    } catch {
      // Fallback local
      sounds.playCoin();
      if (type === 'chicken') {
        const chickens = user.chickens || [];
        if (chickens.length >= 4) { onShowMessage('Chuồng gà đã đầy (tối đa 4 con)!'); return; }
        const newChicken = { id: Date.now(), fed: false, eggsReady: false, fedAt: 0, readyAt: 0 };
        onUpdateUser({ xu: user.xu - cost, chickens: [...chickens, newChicken] });
      } else {
        const pigs = user.pigs || [];
        if (pigs.length >= 4) { onShowMessage('Chuồng heo đã đầy (tối đa 4 con)!'); return; }
        const newPig = { id: Date.now(), fed: false, productReady: false, fedAt: 0, readyAt: 0 };
        onUpdateUser({ xu: user.xu - cost, pigs: [...pigs, newPig] });
      }
      onShowMessage(`🎉 Mua thành công 1 ${name} vào trang trại!`);
    }
  };

  // Cho Vật Nuôi Ăn
  const handleFeedAnimal = async (type: 'chicken' | 'pig', id: number) => {
    sounds.playHarvest();
    const cost = type === 'chicken' ? 20 : 50;
    const duration = type === 'chicken' ? 60 : 150;

    try {
      const token = localStorage.getItem('game_auth_token') || '';
      const res = await fetch('/api/game/animals/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ animalType: type, animalId: id })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateUser(data.user);
        onShowMessage(`🌾 ${data.message}`);
      } else {
        onShowMessage(`❌ ${data.error}`);
      }
    } catch {
      // Fallback local
      const now = Date.now();
      if (type === 'chicken') {
        const chickens = (user.chickens || []).map(c => c.id === id ? { ...c, fed: true, fedAt: now, readyAt: now + duration * 1000, eggsReady: false } : c);
        onUpdateUser({ xu: Math.max(0, user.xu - cost), chickens });
      } else {
        const pigs = (user.pigs || []).map(p => p.id === id ? { ...p, fed: true, fedAt: now, readyAt: now + duration * 1000, productReady: false } : p);
        onUpdateUser({ xu: Math.max(0, user.xu - cost), pigs });
      }
      onShowMessage(`🌾 Đã cho ăn! Vật nuôi sẽ cho sản phẩm sau ${formatTimeLeft(duration)}.`);
    }
  };

  // Thu Hoạch Sản Phẩm (Trứng, Thịt)
  const handleCollectProduct = async (type: 'chicken' | 'pig', id: number) => {
    sounds.playCoin();
    try {
      const token = localStorage.getItem('game_auth_token') || '';
      const res = await fetch('/api/game/animals/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ animalType: type, animalId: id })
      });
      const data = await res.json();
      if (data.success) {
        try { confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } }); } catch {}
        onUpdateUser(data.user);
        onShowMessage(`🎁 ${data.message}`);
      } else {
        onShowMessage(`❌ ${data.error}`);
      }
    } catch {
      // Fallback local
      if (type === 'chicken') {
        const chickens = (user.chickens || []).map(c => c.id === id ? { ...c, fed: false, eggsReady: false, fedAt: 0, readyAt: 0 } : c);
        const inv = [...user.inventory];
        const exist = inv.find(i => i.id === 'egg_fresh');
        if (exist) exist.count += 1;
        else inv.push({ id: 'egg_fresh', name: 'Trứng Gà Tươi', type: 'egg', count: 1, sellPrice: 85, icon: '🥚', description: 'Trứng gà tươi ngon bán được 85 Xu.' });
        onUpdateUser({ chickens, inventory: inv, exp: user.exp + 15 });
        onShowMessage('🥚 Bạn đã nhặt được 1 Trứng Gà Tươi! (+15 EXP)');
      } else {
        const pigs = (user.pigs || []).map(p => p.id === id ? { ...p, fed: false, productReady: false, fedAt: 0, readyAt: 0 } : p);
        const inv = [...user.inventory];
        const exist = inv.find(i => i.id === 'pork_fresh');
        if (exist) exist.count += 1;
        else inv.push({ id: 'pork_fresh', name: 'Thịt Heo Tươi Sạch', type: 'crop', count: 1, sellPrice: 350, icon: '🥩', description: 'Thịt heo tươi bán được 350 Xu.' });
        onUpdateUser({ pigs, inventory: inv, exp: user.exp + 40 });
        onShowMessage('🥩 Bạn đã thu hoạch 1 Thịt Heo Tươi Sạch! (+40 EXP)');
      }
    }
  };

  const chickens = user.chickens || [];
  const pigs = user.pigs || [];

  return (
    <div className="relative min-h-[calc(100vh-140px)] pb-24 pt-4 px-2 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Banner Title & Quick Controls */}
        <div className="bg-[#381c10] pixel-box p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-3xl sm:text-4xl filter drop-shadow">🌾</span>
            <div>
              <h1 className="text-base sm:text-lg font-black text-amber-200 tracking-wide uppercase font-pixel flex items-center gap-2 pixel-shadow-sm">
                Nông Trại & Chuồng Trại Dân Gian
              </h1>
              <p className="text-xs text-amber-300/80 font-vt323 text-sm sm:text-base">
                Trồng trọt theo thời gian thực, mua con giống nuôi gà đẻ trứng & nuôi heo lấy thịt!
              </p>
            </div>
          </div>

          {/* Quick Actions Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleHarvestAll}
              className="pixel-btn bg-emerald-700 hover:bg-emerald-600 text-white font-pixel text-[10px] px-3 py-2 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Gặt Tất Cả</span>
            </button>
          </div>
        </div>

        {/* The Farm Yard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Soil Field (6 Plots) */}
          <div className="lg:col-span-3 bg-[#1e3814] pixel-box-green p-4 sm:p-5 relative overflow-hidden">
            {/* Wooden Fence Header Decoration */}
            <div className="flex items-center justify-between border-b-2 border-[#122b0c] pb-2.5 mb-4">
              <div className="flex items-center gap-2 text-emerald-200 font-pixel text-xs">
                <span>🏡 Vườn Rau Cây Trái (6 Luống)</span>
              </div>
              <div className="text-[9px] font-pixel text-emerald-300 bg-[#0c1f09] px-2 py-1 border border-emerald-700">
                Chạm vào ô đất để gieo hạt & chăm sóc
              </div>
            </div>

            {/* Grid of Soil Plots */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {user.farmPlots.map((plot) => {
                const status = getPlotStatus(plot);
                const hasCrop = plot.cropId !== null;

                return (
                  <div
                    key={plot.id}
                    onClick={() => {
                      if (!hasCrop) {
                        sounds.playClick();
                        setSelectedPlot(plot);
                        setShowSeedModal(true);
                      } else if (status.mature) {
                        handleHarvestPlot(plot.id);
                      } else if (plot.hasPest) {
                        handleRemovePest(plot.id);
                      } else if (!plot.watered) {
                        handleWaterPlot(plot.id);
                      } else {
                        sounds.playClick();
                        setSelectedPlot(plot);
                      }
                    }}
                    className={`relative aspect-square pixel-plot soil-texture cursor-pointer flex flex-col items-center justify-center p-2 text-center group select-none ${
                      !hasCrop
                        ? 'bg-[#482512] hover:bg-[#582d17]'
                        : status.mature
                        ? 'bg-[#733e1c] ring-2 ring-yellow-400'
                        : 'bg-[#552c15]'
                    }`}
                  >
                    {/* Plot ID Pin */}
                    <span className="absolute top-1 left-1.5 text-[8px] font-pixel text-amber-400/70">
                      #{plot.id}
                    </span>

                    {/* Status badges */}
                    <div className="absolute top-1 right-1 flex gap-1">
                      {plot.watered && (
                        <span className="bg-sky-600 border border-black text-white p-0.5" title="Đã tưới nước">
                          <Droplets className="w-2.5 h-2.5" />
                        </span>
                      )}
                      {plot.fertilized && (
                        <span className="bg-purple-600 border border-black text-white p-0.5" title="Đã bón phân">
                          <Sparkles className="w-2.5 h-2.5" />
                        </span>
                      )}
                      {plot.hasPest && (
                        <span className="bg-red-600 border border-black text-white p-0.5 animate-bounce" title="Có sâu hại!">
                          <Bug className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Content inside plot */}
                    {!hasCrop ? (
                      <div className="flex flex-col items-center text-amber-200/80 group-hover:scale-105 transition-transform">
                        <PlusCircle className="w-6 h-6 mb-1 text-yellow-400" />
                        <span className="font-pixel text-[9px]">Gieo hạt</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full">
                        {/* Crop visual */}
                        <div className="text-3xl sm:text-4xl filter drop-shadow my-1 transition-transform group-hover:scale-115">
                          {status.mature
                            ? status.crop?.icon
                            : status.stage === 'growing'
                            ? status.crop?.icon
                            : '🌱'}
                        </div>

                        {/* Crop Name */}
                        <span className="font-pixel text-[8px] sm:text-[9px] text-amber-100 truncate max-w-full">
                          {status.crop?.name}
                        </span>

                        {/* Progress or Ready state */}
                        {status.mature ? (
                          <span className="mt-1 bg-yellow-400 border border-black text-black font-pixel text-[8px] px-1.5 py-0.5 uppercase animate-bounce font-bold">
                            GẶT!
                          </span>
                        ) : (
                          <div className="w-full mt-1.5 flex flex-col items-center">
                            <div className="w-full h-2 pixel-progress-track relative overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 pixel-progress-fill transition-all duration-300"
                                style={{ width: `${status.progress}%` }}
                              />
                            </div>
                            <span className="text-[8px] text-amber-300 font-pixel mt-0.5 flex items-center gap-0.5">
                              <Clock className="w-2 h-2" />
                              {formatTimeLeft(status.timeLeft)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Farmyard Bottom Details */}
            <div className="mt-4 flex flex-wrap items-center justify-between bg-[#12230d] p-2.5 pixel-box border-emerald-950">
              <div className="flex items-center gap-3">
                <CharacterSprite
                  appearance={user.appearance}
                  nickname={user.nickname}
                  level={user.level}
                  scale={0.8}
                  isWatering={activeAction === 'watering'}
                />
                <div className="text-xs text-emerald-200">
                  <p className="font-pixel text-[9px] text-yellow-300">Trạng thái Nông Dân:</p>
                  <p className="text-emerald-300/90 text-xs font-vt323 text-base">
                    {activeAction === 'watering'
                      ? 'Đang tưới nước cho cây 💧'
                      : activeAction === 'harvesting'
                      ? 'Đang gặt nông sản vàng 🌾'
                      : 'Đang ngắm nông trại xanh ngát'}
                  </p>
                </div>
              </div>

              <div className="text-right text-[9px] font-pixel text-emerald-400/90 hidden sm:block">
                <span>💡 Bón phân giúp rút ngắn 50% thời gian lớn!</span>
              </div>
            </div>
          </div>

          {/* Right Side: Chuồng Trại Chăn Nuôi (Gà & Heo) */}
          <div className="flex flex-col gap-4">
            
            {/* Box Chuồng Trại Tabs */}
            <div className="bg-[#381c10] pixel-box-wood p-3.5">
              
              {/* Tab Selector: Gà 🐔 / Heo 🐷 */}
              <div className="flex items-center justify-between border-b-2 border-[#261208] pb-2 mb-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { sounds.playClick(); setAnimalTab('chicken'); }}
                    className={`pixel-btn px-2 py-1 text-[8.5px] font-pixel transition-all ${
                      animalTab === 'chicken'
                        ? 'bg-amber-600 text-white'
                        : 'bg-[#1e0e06] text-amber-300'
                    }`}
                  >
                    🐔 Chuồng Gà ({chickens.length}/4)
                  </button>
                  <button
                    onClick={() => { sounds.playClick(); setAnimalTab('pig'); }}
                    className={`pixel-btn px-2 py-1 text-[8.5px] font-pixel transition-all ${
                      animalTab === 'pig'
                        ? 'bg-rose-700 text-white'
                        : 'bg-[#1e0e06] text-rose-300'
                    }`}
                  >
                    🐷 Chuồng Heo ({pigs.length}/4)
                  </button>
                </div>
              </div>

              {/* PHÂN KHU 1: CHUỒNG GÀ */}
              {animalTab === 'chicken' && (
                <div>
                  {chickens.length === 0 ? (
                    <div className="bg-[#241107] p-3 text-center pixel-box border-amber-950 mb-3">
                      <span className="text-3xl block my-1">🏚️</span>
                      <p className="font-pixel text-[9px] text-amber-200 mb-1">
                        Chuồng Gà Đang Trống
                      </p>
                      <p className="font-vt323 text-sm text-amber-300/80 mb-2.5">
                        Mới vào bạn chưa có gà. Hãy mua Gà con về nuôi để đẻ trứng bán lấy Xu!
                      </p>
                      <button
                        onClick={() => handleBuyAnimal('chicken')}
                        className="pixel-btn bg-yellow-500 hover:bg-yellow-400 text-black font-pixel text-[9px] px-3 py-1.5 shadow"
                      >
                        ➕ Mua Gà Con (300 Xu)
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 mb-3">
                      {chickens.map((chicken, idx) => {
                        const now = Date.now();
                        const isFed = chicken.fed;
                        const durationSec = 60; // 60s
                        const readyAt = chicken.readyAt || (chicken.fedAt ? chicken.fedAt + durationSec * 1000 : 0);
                        const isReady = isFed && (chicken.eggsReady || now >= readyAt);
                        const timeLeft = Math.max(0, Math.ceil((readyAt - now) / 1000));
                        const progress = Math.min(100, Math.max(0, ((durationSec - timeLeft) / durationSec) * 100));

                        return (
                          <div
                            key={chicken.id}
                            className="bg-[#261309] p-2 pixel-box border-amber-950 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-2xl ${isReady ? 'animate-bounce' : isFed ? 'animate-pulse' : ''}`}>
                                {isReady ? '🥚' : idx % 2 === 0 ? '🐓' : '🐔'}
                              </span>
                              <div>
                                <span className="text-[10px] font-bold text-amber-100 block font-pixel">
                                  Gà #{idx + 1}
                                </span>
                                {isReady ? (
                                  <span className="font-pixel text-[8px] text-yellow-300 animate-pulse">
                                    Đã đẻ trứng!
                                  </span>
                                ) : isFed ? (
                                  <div className="flex flex-col">
                                    <span className="font-pixel text-[7.5px] text-amber-300">
                                      Ấp trứng: {timeLeft}s
                                    </span>
                                    <div className="w-16 h-1.5 bg-black/60 rounded overflow-hidden mt-0.5">
                                      <div className="h-full bg-yellow-400" style={{ width: `${progress}%` }} />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="font-pixel text-[8px] text-red-300">
                                    Đang đói bụng
                                  </span>
                                )}
                              </div>
                            </div>

                            {isReady ? (
                              <button
                                onClick={() => handleCollectProduct('chicken', chicken.id)}
                                className="pixel-btn bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-[8.5px] px-2 py-1 flex items-center gap-1 shadow animate-bounce"
                              >
                                <Egg className="w-3 h-3" />
                                <span>Nhặt</span>
                              </button>
                            ) : (
                              <button
                                disabled={isFed}
                                onClick={() => handleFeedAnimal('chicken', chicken.id)}
                                className={`pixel-btn font-pixel text-[8.5px] px-2 py-1 flex items-center gap-1 ${
                                  isFed
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                                }`}
                              >
                                <Wheat className="w-3 h-3" />
                                <span>Cho ăn (20x)</span>
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {chickens.length < 4 && (
                        <button
                          onClick={() => handleBuyAnimal('chicken')}
                          className="pixel-btn bg-[#2a1408] hover:bg-[#3a1c0b] text-amber-300 font-pixel text-[8px] py-1 border border-dashed border-amber-800"
                        >
                          ➕ Mua Thêm Gà Con (300 Xu)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PHÂN KHU 2: CHUỒNG HEO */}
              {animalTab === 'pig' && (
                <div>
                  {pigs.length === 0 ? (
                    <div className="bg-[#241107] p-3 text-center pixel-box border-rose-950 mb-3">
                      <span className="text-3xl block my-1">🐷</span>
                      <p className="font-pixel text-[9px] text-rose-200 mb-1">
                        Chuồng Heo Đang Trống
                      </p>
                      <p className="font-vt323 text-sm text-rose-300/80 mb-2.5">
                        Mua Heo con về nuôi lấy thịt sạch chất lượng cao bán cho thương lái thu về nhiều Xu!
                      </p>
                      <button
                        onClick={() => handleBuyAnimal('pig')}
                        className="pixel-btn bg-rose-600 hover:bg-rose-500 text-white font-pixel text-[9px] px-3 py-1.5 shadow"
                      >
                        ➕ Mua Heo Con (1,200 Xu)
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 mb-3">
                      {pigs.map((pig, idx) => {
                        const now = Date.now();
                        const isFed = pig.fed;
                        const durationSec = 150; // 150s
                        const readyAt = pig.readyAt || (pig.fedAt ? pig.fedAt + durationSec * 1000 : 0);
                        const isReady = isFed && (pig.productReady || now >= readyAt);
                        const timeLeft = Math.max(0, Math.ceil((readyAt - now) / 1000));
                        const progress = Math.min(100, Math.max(0, ((durationSec - timeLeft) / durationSec) * 100));

                        return (
                          <div
                            key={pig.id}
                            className="bg-[#261309] p-2 pixel-box border-rose-950 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-2xl ${isReady ? 'animate-bounce' : isFed ? 'animate-pulse' : ''}`}>
                                {isReady ? '🥩' : '🐷'}
                              </span>
                              <div>
                                <span className="text-[10px] font-bold text-rose-100 block font-pixel">
                                  Heo #{idx + 1}
                                </span>
                                {isReady ? (
                                  <span className="font-pixel text-[8px] text-yellow-300 animate-pulse">
                                    Đã lớn xuất chuồng!
                                  </span>
                                ) : isFed ? (
                                  <div className="flex flex-col">
                                    <span className="font-pixel text-[7.5px] text-rose-300">
                                      Đang lớn: {formatTimeLeft(timeLeft)}
                                    </span>
                                    <div className="w-16 h-1.5 bg-black/60 rounded overflow-hidden mt-0.5">
                                      <div className="h-full bg-rose-500" style={{ width: `${progress}%` }} />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="font-pixel text-[8px] text-red-300">
                                    Đang đói cám
                                  </span>
                                )}
                              </div>
                            </div>

                            {isReady ? (
                              <button
                                onClick={() => handleCollectProduct('pig', pig.id)}
                                className="pixel-btn bg-rose-600 hover:bg-rose-500 text-white font-pixel text-[8.5px] px-2 py-1 flex items-center gap-1 shadow animate-bounce"
                              >
                                <span>Gặt thịt</span>
                              </button>
                            ) : (
                              <button
                                disabled={isFed}
                                onClick={() => handleFeedAnimal('pig', pig.id)}
                                className={`pixel-btn font-pixel text-[8.5px] px-2 py-1 flex items-center gap-1 ${
                                  isFed
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-amber-700 hover:bg-amber-600 text-white'
                                }`}
                              >
                                <span>Đổ cám (50x)</span>
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {pigs.length < 4 && (
                        <button
                          onClick={() => handleBuyAnimal('pig')}
                          className="pixel-btn bg-[#2a1408] hover:bg-[#3a1c0b] text-rose-300 font-pixel text-[8px] py-1 border border-dashed border-rose-800"
                        >
                          ➕ Mua Thêm Heo Con (1,200 Xu)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Farm Merchant NPC (Bác Ba Nông Dân) */}
            <div className="bg-[#2d160b] pixel-box-wood p-3.5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-10 h-10 bg-amber-300 border-2 border-black flex items-center justify-center text-xl shrink-0">
                  🧔‍♂️
                </div>
                <div>
                  <h4 className="font-pixel text-[11px] text-amber-200">Bác Ba Nông Dân</h4>
                  <p className="font-pixel text-[8px] text-yellow-400">Thương Lái Nông Sản</p>
                </div>
              </div>
              <p className="text-xs font-vt323 text-base text-amber-100/90 italic bg-[#170a04] p-2 border border-amber-900/60 mb-3">
                &ldquo;Bà con chăm chỉ trồng trọt và chăn nuôi, có bao nhiêu nông sản, trứng gà, thịt heo tôi bao tiêu thu mua toàn bộ giá cao!&rdquo;
              </p>

              {/* Total Crops summary */}
              <div className="bg-[#170a04] p-2 border border-amber-900/60 flex items-center justify-between text-xs">
                <span className="font-pixel text-[8px] text-amber-300">Đã gặt:</span>
                <span className="font-pixel text-[9px] text-yellow-400">
                  {user.stats.cropsHarvested} Cây hoa màu
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Seed Selection Dialog */}
      {showSeedModal && selectedPlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#271207] pixel-box-gold w-full max-w-lg p-4 sm:p-5 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-900/60 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌱</span>
                <h3 className="font-pixel text-xs sm:text-sm text-amber-200">
                  Gieo Hạt Vào Ô #{selectedPlot.id}
                </h3>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowSeedModal(false);
                  setSelectedPlot(null);
                }}
                className="pixel-btn bg-red-900 hover:bg-red-800 text-white font-pixel text-[10px] px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Seed list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {CROPS.map((crop) => {
                const userInventorySeed = user.inventory.find(
                  (i) => i.type === 'seed' && (i.id === `seed_${crop.id}` || i.id === `${crop.id}_seed` || i.id === crop.id)
                );
                const seedCount = userInventorySeed ? userInventorySeed.count : 0;
                const isLocked = user.level < crop.levelRequired;

                return (
                  <div
                    key={crop.id}
                    className={`p-2.5 border-2 flex flex-col justify-between transition-all ${
                      isLocked
                        ? 'bg-black/40 border-gray-800 opacity-60'
                        : 'bg-[#361a0d] hover:bg-[#452212] border-amber-800/80 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 mb-2">
                      <span className="text-2xl p-1 bg-black/50 border border-amber-900 shrink-0">
                        {crop.icon}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-pixel text-[10px] text-amber-200">
                            {crop.name}
                          </h4>
                          {isLocked && (
                            <span className="font-pixel text-[8px] bg-red-900 text-red-200 px-1 py-0.5 border border-black">
                              Lv.{crop.levelRequired}
                            </span>
                          )}
                        </div>
                        <p className="font-vt323 text-sm text-amber-300/80 line-clamp-1">
                          {crop.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1 font-pixel text-[8px] text-amber-300">
                          <span>⏱️ {formatTimeLeft(crop.growDuration)}</span>
                          <span>⭐ +{crop.expReward} EXP</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-amber-900/60">
                      <div className="font-pixel text-[9px]">
                        {seedCount > 0 ? (
                          <span className="text-emerald-400">
                            Có: {seedCount} hạt
                          </span>
                        ) : (
                          <span className="text-yellow-400">
                            Giá: {crop.seedPrice} Xu
                          </span>
                        )}
                      </div>

                      <button
                        disabled={isLocked}
                        onClick={() => handlePlantSeed(crop)}
                        className={`pixel-btn font-pixel text-[9px] px-2.5 py-1 ${
                          isLocked
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : seedCount > 0
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-amber-600 hover:bg-amber-500 text-yellow-100'
                        }`}
                      >
                        {seedCount > 0 ? 'Gieo' : 'Mua & Gieo'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Plot Detailed Care Actions (Tưới nước, bón phân) */}
      {selectedPlot && !showSeedModal && selectedPlot.cropId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#271207] pixel-box-gold w-full max-w-sm p-4 sm:p-5 relative text-center">
            <button
              onClick={() => setSelectedPlot(null)}
              className="absolute top-2.5 right-2.5 pixel-btn bg-red-900 hover:bg-red-800 text-white font-pixel text-[9px] px-2 py-0.5"
            >
              ✕
            </button>

            {(() => {
              const status = getPlotStatus(selectedPlot);
              return (
                <div>
                  <div className="text-5xl my-2 filter drop-shadow">
                    {status.mature ? status.crop?.icon : '🌱'}
                  </div>
                  <h3 className="font-pixel text-xs text-amber-200">
                    Luống #{selectedPlot.id} - {status.crop?.name}
                  </h3>
                  <p className="font-vt323 text-base text-amber-300 mt-1">
                    {status.mature
                      ? 'Cây đã chín vàng, sẵn sàng thu hoạch!'
                      : `Thời gian còn lại: ${formatTimeLeft(status.timeLeft)}`}
                  </p>

                  {/* Actions buttons */}
                  <div className="flex flex-col gap-2 mt-3">
                    {status.mature ? (
                      <button
                        onClick={() => {
                          handleHarvestPlot(selectedPlot.id);
                          setSelectedPlot(null);
                        }}
                        className="pixel-btn bg-yellow-500 hover:bg-yellow-400 text-black font-pixel text-xs py-2 animate-bounce"
                      >
                        🌾 Thu Hoạch Ngay
                      </button>
                    ) : (
                      <>
                        {!selectedPlot.watered && (
                          <button
                            onClick={() => {
                              handleWaterPlot(selectedPlot.id);
                              setSelectedPlot(null);
                            }}
                            className="pixel-btn bg-sky-700 hover:bg-sky-600 text-white font-pixel text-[10px] py-1.5 flex items-center justify-center gap-1.5"
                          >
                            <Droplets className="w-3.5 h-3.5" />
                            <span>Tưới Nước</span>
                          </button>
                        )}

                        {!selectedPlot.fertilized && (
                          <button
                            onClick={() => {
                              handleFertilizePlot(selectedPlot.id);
                              setSelectedPlot(null);
                            }}
                            className="pixel-btn bg-purple-700 hover:bg-purple-600 text-white font-pixel text-[10px] py-1.5 flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                            <span>Bón Phân (Rút ngắn thời gian)</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
