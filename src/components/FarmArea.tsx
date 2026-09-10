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
  Shovel, 
  Egg, 
  Wheat, 
  PlusCircle,
  TrendingUp,
  CheckCircle2
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

  // Timer to update crop growth in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      (item) => item.type === 'seed' && (item.id === `${crop.id}_seed` || item.id === crop.id) && item.count > 0
    );

    if (!seedInventoryItem && user.xu < crop.seedPrice) {
      sounds.playClick();
      onShowMessage(`Ban khong co hat giong va khong du ${crop.seedPrice} Xu de gieo!`);
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
    onShowMessage(`Da gieo ${crop.name}! Hay cham soc tuoi nuoc cho cay mau lon.`);
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
    onShowMessage('Da tuoi nuoc mat cho cay! Cay dang xanh tuoi tro lai.');
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
    onShowMessage('Da bat sach sau bo hai cay! Nhan duoc +5 EXP.');
  };

  // Action: Fertilize plot
  const handleFertilizePlot = (plotId: number) => {
    const fertItem = user.inventory.find((item) => item.id === 'fertilizer' && item.count > 0);
    if (!fertItem) {
      onShowMessage('Ban khong co phan bon trong ruong do! Hay ghe Cua Hang mua nhe.');
      return;
    }

    sounds.playHarvest();
    const updatedPlots = user.farmPlots.map((p) => {
      if (p.id === plotId) {
        return { ...p, fertilized: true, plantedAt: (p.plantedAt || Date.now()) - 10000 };
      }
      return p;
    });

    const updatedInv = user.inventory.map((item) => {
      if (item.id === 'fertilizer') {
        return { ...item, count: item.count - 1 };
      }
      return item;
    }).filter((i) => i.count > 0);

    onUpdateUser({
      farmPlots: updatedPlots,
      inventory: updatedInv,
    });
    onShowMessage('Da bon phan kich thich! Thoi gian thu hoach duoc rut ngan 50%.');
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
    } catch {
      // Ignored if blocked
    }

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
    const existingCropIndex = user.inventory.findIndex((item) => item.id === `crop_${crop.id}`);
    let updatedInventory = [...user.inventory];
    if (existingCropIndex >= 0) {
      updatedInventory[existingCropIndex].count += 1;
    } else {
      updatedInventory.push({
        id: `crop_${crop.id}`,
        name: crop.name,
        type: 'crop',
        count: 1,
        sellPrice: crop.sellPrice,
        icon: crop.icon,
        description: `Nong san tuoi ngon thu hoach tu canh dong, ban duoc ${crop.sellPrice} Xu.`,
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
      newLuong += 2; // reward 2 luong
      sounds.playLevelUp();
      onShowMessage(`🎉 CHUC MUNG! Ban da thang len Cap ${newLevel}! Nhan thuong 2 LUONG.`);
    } else {
      onShowMessage(`🌾 Thu hoach thanh cong 1 ${crop.name}! Nhan +${crop.expReward} EXP (da cat vao Ruong do).`);
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

        const existingCropIdx = updatedInventory.findIndex((i) => i.id === `crop_${status.crop!.id}`);
        if (existingCropIdx >= 0) {
          updatedInventory[existingCropIdx].count += 1;
        } else {
          updatedInventory.push({
            id: `crop_${status.crop!.id}`,
            name: status.crop!.name,
            type: 'crop',
            count: 1,
            sellPrice: status.crop!.sellPrice,
            icon: status.crop!.icon,
            description: `Nong san tuoi ngon thu hoach tu canh dong, ban duoc ${status.crop!.sellPrice} Xu.`,
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
      onShowMessage('Chua co cay nao chin de thu hoach ca!');
      return;
    }

    sounds.playCatchSuccess();
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {
      // Ignored
    }

    onUpdateUser({
      farmPlots: updatedPlots,
      inventory: updatedInventory,
      exp: user.exp + totalExpEarned,
      stats: {
        ...user.stats,
        cropsHarvested: user.stats.cropsHarvested + totalHarvested,
      },
    });
    onShowMessage(`🌾 Da thu hoach toan bo ${totalHarvested} luong cay! Nhan +${totalExpEarned} EXP.`);
  };

  // Chicken coop: feed & collect eggs
  const handleFeedChicken = (chickenId: number) => {
    sounds.playHarvest();
    const updatedChickens = user.chickens.map((c) => {
      if (c.id === chickenId) {
        return { ...c, fed: true, fedAt: Date.now(), eggsReady: true };
      }
      return c;
    });
    onUpdateUser({ chickens: updatedChickens });
    onShowMessage('Da rac thoc cho ga an! Ga vui suong chuan bi de trung vang.');
  };

  const handleCollectEgg = (chickenId: number) => {
    sounds.playCoin();
    const updatedChickens = user.chickens.map((c) => {
      if (c.id === chickenId) {
        return { ...c, fed: false, eggsReady: false };
      }
      return c;
    });

    const existingEggIdx = user.inventory.findIndex((i) => i.id === 'egg_golden');
    let updatedInv = [...user.inventory];
    if (existingEggIdx >= 0) {
      updatedInv[existingEggIdx].count += 1;
    } else {
      updatedInv.push({
        id: 'egg_golden',
        name: 'Trung Ga Nong Trai',
        type: 'egg',
        count: 1,
        sellPrice: 85,
        icon: '🥚',
        description: 'Trung ga tuoi ngon bo duong, dem ban cho lai buon lay 85 Xu.',
      });
    }

    // Update quest
    const updatedQuests = user.quests.map((q) => {
      if (q.id === 'quest_chicken') {
        const newProg = Math.min(q.target, q.progress + 1);
        return { ...q, progress: newProg, completed: newProg >= q.target };
      }
      return q;
    });

    onUpdateUser({
      chickens: updatedChickens,
      inventory: updatedInv,
      quests: updatedQuests,
      exp: user.exp + 15,
    });
    onShowMessage('🥚 Ban da nhat duoc 1 Trung Ga tuoi! +15 EXP (co the ban lay 85 Xu).');
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] pb-24 pt-4 px-2 sm:px-6">
      {/* Farm Background Panorama */}
      <div className="max-w-5xl mx-auto">
        {/* Banner Title & Quick Controls */}
        <div className="bg-[#381c10] pixel-box p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-3xl sm:text-4xl filter drop-shadow">🌾</span>
            <div>
              <h1 className="text-base sm:text-lg font-black text-amber-200 tracking-wide uppercase font-pixel flex items-center gap-2 pixel-shadow-sm">
                Nong Trai Avatar
              </h1>
              <p className="text-xs text-amber-300/80 font-vt323 text-sm sm:text-base">
                Gieo hat, tuoi nuoc, bon phan, thu hoach nong san doi lay Xu vang!
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
              <span>Gat Tat Ca</span>
            </button>
          </div>
        </div>

        {/* The Farm Yard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Soil Field (12 Plots) */}
          <div className="lg:col-span-3 bg-[#1e3814] pixel-box-green p-4 sm:p-5 relative overflow-hidden">
            {/* Wooden Fence Header Decoration */}
            <div className="flex items-center justify-between border-b-2 border-[#122b0c] pb-2.5 mb-4">
              <div className="flex items-center gap-2 text-emerald-200 font-pixel text-xs">
                <span>🏡 Vuon Rau Cay Trai (12 Luong)</span>
              </div>
              <div className="text-[9px] font-pixel text-emerald-300 bg-[#0c1f09] px-2 py-1 border border-emerald-700">
                Cham vao o dat de cham soc
              </div>
            </div>

            {/* Grid of Soil Plots */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
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
                        <span className="bg-sky-600 border border-black text-white p-0.5" title="Da tuoi nuoc">
                          <Droplets className="w-2.5 h-2.5" />
                        </span>
                      )}
                      {plot.fertilized && (
                        <span className="bg-purple-600 border border-black text-white p-0.5" title="Da bon phan">
                          <Sparkles className="w-2.5 h-2.5" />
                        </span>
                      )}
                      {plot.hasPest && (
                        <span className="bg-red-600 border border-black text-white p-0.5 animate-bounce" title="Co sau hai!">
                          <Bug className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Content inside plot */}
                    {!hasCrop ? (
                      <div className="flex flex-col items-center text-amber-200/80 group-hover:scale-105 transition-transform">
                        <PlusCircle className="w-6 h-6 mb-1 text-yellow-400" />
                        <span className="font-pixel text-[9px]">Gieo hat</span>
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
                          <span className="mt-1 bg-yellow-400 border border-black text-black font-pixel text-[8px] px-1.5 py-0.5 uppercase animate-bounce">
                            GAT!
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
                              {status.timeLeft}s
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
                  <p className="font-pixel text-[9px] text-yellow-300">Trang thai Nong Dan:</p>
                  <p className="text-emerald-300/90 text-xs font-vt323 text-base">
                    {activeAction === 'watering'
                      ? 'Dang tuoi nuoc cho cay 💧'
                      : activeAction === 'harvesting'
                      ? 'Dang gat nong san vang 🌾'
                      : 'Dang ngam dong lua xanh ngat'}
                  </p>
                </div>
              </div>

              <div className="text-right text-[9px] font-pixel text-emerald-400/90 hidden sm:block">
                <span>💡 Bon phan giup cay lon nhanh gap doi!</span>
              </div>
            </div>
          </div>

          {/* Right Side: Chicken Coop & Farm Merchant */}
          <div className="flex flex-col gap-4">
            {/* Chuồng Gà Đẻ Trứng */}
            <div className="bg-[#381c10] pixel-box-wood p-3.5">
              <div className="flex items-center justify-between border-b-2 border-[#261208] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🐔</span>
                  <span className="font-pixel text-xs text-amber-200">Chuong Ga</span>
                </div>
                <span className="bg-[#170a04] text-amber-300 font-pixel text-[8px] px-1.5 py-0.5 border border-amber-700">
                  2 Ga
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {user.chickens.map((chicken, idx) => (
                  <div
                    key={chicken.id}
                    className="bg-[#261309] p-2 pixel-box border-amber-950 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl animate-bounce">
                        {idx === 0 ? '🐓' : '🐔'}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-amber-100 block">
                          Ga De #{chicken.id}
                        </span>
                        <span className="text-[10px] text-amber-300/70">
                          {chicken.eggsReady
                            ? 'Trung vang da san sang!'
                            : chicken.fed
                            ? 'Dang ap trung...'
                            : 'Dang doi bung'}
                        </span>
                      </div>
                    </div>

                    {chicken.eggsReady ? (
                      <button
                        onClick={() => handleCollectEgg(chicken.id)}
                        className="pixel-btn bg-amber-500 hover:bg-amber-400 text-black font-pixel text-[9px] px-2 py-1 flex items-center gap-1"
                      >
                        <Egg className="w-3 h-3" />
                        <span>Nhat trung</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFeedChicken(chicken.id)}
                        className="pixel-btn bg-emerald-700 hover:bg-emerald-600 text-white font-pixel text-[9px] px-2 py-1 flex items-center gap-1"
                      >
                        <Wheat className="w-3 h-3" />
                        <span>Cho an</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Farm Merchant NPC (Lái buôn nông sản) */}
            <div className="bg-[#2d160b] pixel-box-wood p-3.5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-10 h-10 bg-amber-300 border-2 border-black flex items-center justify-center text-xl shrink-0">
                  🧔‍♂️
                </div>
                <div>
                  <h4 className="font-pixel text-[11px] text-amber-200">Bac Ba Nong Dan</h4>
                  <p className="font-pixel text-[8px] text-yellow-400">Lai buon Avatar</p>
                </div>
              </div>
              <p className="text-xs font-vt323 text-base text-amber-100/90 italic bg-[#170a04] p-2 border border-amber-900/60 mb-3">
                &ldquo;Ba con cu cham chi cay cay, co bao nhieu nong san va trung ga toi bao tieu thu mua toan bo gia cao!&rdquo;
              </p>

              {/* Total Crops summary */}
              <div className="bg-[#170a04] p-2 border border-amber-900/60 flex items-center justify-between text-xs">
                <span className="font-pixel text-[8px] text-amber-300">Da gat:</span>
                <span className="font-pixel text-[9px] text-yellow-400">
                  {user.stats.cropsHarvested} Cay hoa mau
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
                  Gieo Hat Vao O #{selectedPlot.id}
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
                  (i) => i.type === 'seed' && (i.id === `${crop.id}_seed` || i.id === crop.id)
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
                          <span>⏱️ {crop.growDuration}s</span>
                          <span>⭐ +{crop.expReward}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-amber-900/60">
                      <div className="font-pixel text-[9px]">
                        {seedCount > 0 ? (
                          <span className="text-emerald-400">
                            Co: {seedCount} hat
                          </span>
                        ) : (
                          <span className="text-yellow-400">
                            Gia: {crop.seedPrice} Xu
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
                    Luong #{selectedPlot.id} - {status.crop?.name}
                  </h3>
                  <p className="font-vt323 text-base text-amber-300 mt-1">
                    {status.mature
                      ? 'Cay da chin vang, san sang thu hoach!'
                      : `Thoi gian con: ${status.timeLeft} giay`}
                  </p>

                  {/* Actions buttons */}
                  <div className="flex flex-col gap-2 mt-3">
                    {status.mature ? (
                      <button
                        onClick={() => {
                          handleHarvestPlot(selectedPlot.id);
                          setSelectedPlot(null);
                        }}
                        className="pixel-btn bg-yellow-500 hover:bg-yellow-400 text-black font-pixel text-[10px] py-2.5 flex items-center justify-center gap-1.5 shadow"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>THU HOACH NGAY</span>
                      </button>
                    ) : (
                      <>
                        <button
                          disabled={selectedPlot.watered}
                          onClick={() => {
                            handleWaterPlot(selectedPlot.id);
                            setSelectedPlot(null);
                          }}
                          className={`pixel-btn py-2 flex items-center justify-center gap-1.5 font-pixel text-[9px] ${
                            selectedPlot.watered
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                              : 'bg-sky-600 hover:bg-sky-500 text-white'
                          }`}
                        >
                          <Droplets className="w-3.5 h-3.5" />
                          <span>{selectedPlot.watered ? 'Da tuoi nuoc' : 'Tuoi Nuoc Cho Cay'}</span>
                        </button>

                        <button
                          disabled={selectedPlot.fertilized}
                          onClick={() => {
                            handleFertilizePlot(selectedPlot.id);
                            setSelectedPlot(null);
                          }}
                          className={`pixel-btn py-2 flex items-center justify-center gap-1.5 font-pixel text-[9px] ${
                            selectedPlot.fertilized
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                              : 'bg-purple-700 hover:bg-purple-600 text-white'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                          <span>{selectedPlot.fertilized ? 'Da bon phan' : 'Bon Phan Tang Toc (50%)'}</span>
                        </button>
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
