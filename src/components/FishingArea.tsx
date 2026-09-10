import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, FishDefinition, FishingRod, BaitDefinition } from '../types';
import { FISH_SPECIES, FISHING_RODS, BAITS } from '../utils/gameData';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { CharacterSprite } from './CharacterSprite';
import { 
  Fish, 
  Sparkles, 
  Flame, 
  Coins, 
  ShieldAlert, 
  Anchor, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface FishingAreaProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onShowMessage: (msg: string) => void;
  onOpenShop: () => void;
}

type FishingState = 'idle' | 'waiting' | 'biting' | 'reeling' | 'caught' | 'missed';

export const FishingArea: React.FC<FishingAreaProps> = ({
  user,
  onUpdateUser,
  onShowMessage,
  onOpenShop,
}) => {
  const [fishingState, setFishingState] = useState<FishingState>('idle');
  const [biteCountdown, setBiteCountdown] = useState<number>(0);
  const [caughtFish, setCaughtFish] = useState<{ fish: FishDefinition; weight: number } | null>(null);
  
  // Reeling mini-game timing meter
  const [meterPosition, setMeterPosition] = useState<number>(50); // 0 - 100
  const [meterDirection, setMeterDirection] = useState<'up' | 'down'>('up');
  const [targetRange] = useState<{ min: number; max: number }>({ min: 38, max: 62 });
  const animationFrameRef = useRef<number | null>(null);

  const equippedRod: FishingRod = 
    FISHING_RODS.find((r) => r.id === user.equippedRodId) || FISHING_RODS[0];
  
  const baitCount = user.inventory
    .filter((i) => i.type === 'bait')
    .reduce((sum, item) => sum + item.count, 0);

  // Meter oscillator for the reeling mini game
  useEffect(() => {
    if (fishingState === 'reeling') {
      const speed = 1.8;
      const step = () => {
        setMeterPosition((prev) => {
          let next = meterDirection === 'up' ? prev + speed : prev - speed;
          if (next >= 100) {
            setMeterDirection('down');
            next = 100;
          } else if (next <= 0) {
            setMeterDirection('up');
            next = 0;
          }
          return next;
        });
        animationFrameRef.current = requestAnimationFrame(step);
      };
      animationFrameRef.current = requestAnimationFrame(step);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [fishingState, meterDirection]);

  // Action: Cast fishing line
  const handleCastLine = () => {
    if (user.energy < 2) {
      onShowMessage('Ban da kiet suc (can it nhat 2 Nang luong de cau ca). Hay an ca nuong hoac nghi ngoi nhe!');
      return;
    }

    if (baitCount <= 0) {
      onShowMessage('Ban da het moi cau! Hay vao Cua Hang mua them Giun hoac Tom moi nhe.');
      return;
    }

    sounds.playWater();
    setFishingState('waiting');
    setCaughtFish(null);

    // Deduct 1 bait
    const firstBaitIndex = user.inventory.findIndex((i) => i.type === 'bait' && i.count > 0);
    let updatedInv = [...user.inventory];
    if (firstBaitIndex >= 0) {
      updatedInv[firstBaitIndex].count -= 1;
      if (updatedInv[firstBaitIndex].count <= 0) {
        updatedInv = updatedInv.filter((_, idx) => idx !== firstBaitIndex);
      }
    }

    onUpdateUser({
      energy: Math.max(0, user.energy - 2),
      inventory: updatedInv,
    });

    // Random wait time before fish bites (2.5s - 5s)
    const waitMs = 2500 + Math.random() * 2500;
    setBiteCountdown(Math.round(waitMs / 1000));

    setTimeout(() => {
      sounds.playBiteAlert();
      setFishingState('biting');

      // 1.5 seconds window to react and start reeling
      setTimeout(() => {
        setFishingState((current) => {
          if (current === 'biting') {
            sounds.playClick();
            onShowMessage('Ca can cau nhung ban khong kip phan ung! Ca da boi mat.');
            return 'missed';
          }
          return current;
        });
      }, 1600);
    }, waitMs);
  };

  // Action: Hook the fish (starts mini-game meter)
  const handleHookFish = () => {
    if (fishingState !== 'biting') return;
    sounds.playClick();
    setFishingState('reeling');
  };

  // Action: Strike/Reel the fish on the meter
  const handleStrike = () => {
    if (fishingState !== 'reeling') return;

    const isHit = meterPosition >= targetRange.min && meterPosition <= targetRange.max;

    if (isHit) {
      // Catch success!
      sounds.playCatchSuccess();
      try {
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#0284c7', '#facc15'],
        });
      } catch {
        // Ignored
      }

      // Determine fish based on rod luck bonus
      const roll = Math.random() * 100 + equippedRod.luckBonus;
      let selectedFish = FISH_SPECIES[0];

      if (roll > 115) {
        selectedFish = FISH_SPECIES[6] || FISH_SPECIES[5]; // Dragon or Shark
      } else if (roll > 90) {
        selectedFish = FISH_SPECIES[5] || FISH_SPECIES[4]; // Shark or Ray
      } else if (roll > 65) {
        selectedFish = FISH_SPECIES[4] || FISH_SPECIES[3];
      } else if (roll > 40) {
        selectedFish = FISH_SPECIES[2];
      } else if (roll > 20) {
        selectedFish = FISH_SPECIES[1];
      } else {
        selectedFish = FISH_SPECIES[0];
      }

      // Random weight
      const weight = +(0.4 + Math.random() * 4.5).toFixed(2);
      setCaughtFish({ fish: selectedFish, weight });
      setFishingState('caught');

      // Add to inventory
      const existingFishIdx = user.inventory.findIndex((i) => i.id === selectedFish.id);
      let updatedInv = [...user.inventory];
      if (existingFishIdx >= 0) {
        updatedInv[existingFishIdx].count += 1;
      } else {
        updatedInv.push({
          id: selectedFish.id,
          name: selectedFish.name,
          type: 'fish',
          count: 1,
          sellPrice: selectedFish.sellPrice,
          icon: selectedFish.icon,
          description: selectedFish.description,
        });
      }

      // Update quests
      const updatedQuests = user.quests.map((q) => {
        if (q.id === 'quest_fish') {
          const newProg = Math.min(q.target, q.progress + 1);
          return { ...q, progress: newProg, completed: newProg >= q.target };
        }
        return q;
      });

      // Experience & Level check
      let newExp = user.exp + selectedFish.expReward;
      let newLevel = user.level;
      let newMaxExp = user.maxExp;
      let newLuong = user.luong;

      if (newExp >= user.maxExp) {
        newLevel += 1;
        newExp -= user.maxExp;
        newMaxExp = Math.round(newMaxExp * 1.5);
        newLuong += 2;
        sounds.playLevelUp();
        onShowMessage(`🎉 CAN THU LEN CAP ${newLevel}! Nhan thuong 2 LUONG.`);
      }

      onUpdateUser({
        inventory: updatedInv,
        exp: newExp,
        level: newLevel,
        maxExp: newMaxExp,
        luong: newLuong,
        quests: updatedQuests,
        stats: {
          ...user.stats,
          fishCaught: user.stats.fishCaught + 1,
        },
      });
    } else {
      // Missed strike
      sounds.playClick();
      setFishingState('missed');
      onShowMessage('Ca quay qua manh da giat dut day cuoc! Hay canh nhip chuan vao vung mau xanh nhe.');
    }
  };

  // Action: Sell immediately for coins
  const handleQuickSell = () => {
    if (!caughtFish) return;
    sounds.playCoin();
    const sellAmount = caughtFish.fish.sellPrice;
    
    // Remove 1 fish from inventory
    const updatedInv = user.inventory.map((item) => {
      if (item.id === caughtFish.fish.id) {
        return { ...item, count: item.count - 1 };
      }
      return item;
    }).filter((i) => i.count > 0);

    onUpdateUser({
      inventory: updatedInv,
      xu: user.xu + sellAmount,
      stats: {
        ...user.stats,
        moneyEarned: user.stats.moneyEarned + sellAmount,
      },
    });

    onShowMessage(`💰 Da ban ${caughtFish.fish.name} cho lai buon ho cau, thu ve ${sellAmount} Xu!`);
    setFishingState('idle');
    setCaughtFish(null);
  };

  // Action: Grill and eat fish to restore energy
  const handleGrillFish = () => {
    if (!caughtFish) return;
    sounds.playHarvest();
    const energyRestored = 35;

    // Remove 1 fish from inventory
    const updatedInv = user.inventory.map((item) => {
      if (item.id === caughtFish.fish.id) {
        return { ...item, count: item.count - 1 };
      }
      return item;
    }).filter((i) => i.count > 0);

    onUpdateUser({
      inventory: updatedInv,
      energy: Math.min(user.maxEnergy, user.energy + energyRestored),
    });

    onShowMessage(`🍢 Nuong ${caughtFish.fish.name} gion rum thom lung! Hoi phuc +${energyRestored} Nang luong.`);
    setFishingState('idle');
    setCaughtFish(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] pb-24 pt-4 px-2 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Banner Header */}
        <div className="bg-[#12283e] pixel-box-water p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl filter drop-shadow">🎣</span>
            <div>
              <h1 className="text-base sm:text-lg font-black text-sky-200 tracking-wide uppercase font-pixel flex items-center gap-2 pixel-shadow-sm">
                Ho Cau Ca Sinh Thai
              </h1>
              <p className="font-vt323 text-base text-sky-300/80">
                Tha cau ven ho, canh phao giat ca, san thuy quai doi lay bon Xu!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenShop}
              className="pixel-btn bg-sky-700 hover:bg-sky-600 text-white font-pixel text-[10px] px-3 py-2 flex items-center gap-1.5"
            >
              <span>Mua Can & Moi</span>
            </button>
          </div>
        </div>

        {/* Fishing Scenery Card */}
        <div className="bg-[#0b1b2d] pixel-box-water p-4 sm:p-6 relative overflow-hidden">
          {/* Decorative water ripples & lotus pads */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-1/4 left-1/5 text-3xl">🪷</div>
            <div className="absolute top-1/2 right-1/4 text-2xl">🪷</div>
            <div className="absolute bottom-1/4 left-1/3 text-xl">🫧</div>
            <div className="absolute bottom-1/3 right-1/3 text-2xl">🫧</div>
          </div>

          {/* Wooden Pier & Character Station */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            {/* Left: Fisherman Character on Wooden Pier */}
            <div className="flex flex-col items-center">
              {/* Wooden Pier Platform */}
              <div className="relative flex flex-col items-center">
                <CharacterSprite
                  appearance={user.appearance}
                  nickname={user.nickname}
                  level={user.level}
                  scale={1.1}
                  isFishing={fishingState === 'waiting' || fishingState === 'biting' || fishingState === 'reeling'}
                />

                {/* Wooden bridge slats under feet */}
                <div className="w-36 h-5 bg-[#59270a] border-2 border-black mt-1 flex items-center justify-around px-2 shadow-md">
                  <span className="w-1.5 h-3 bg-[#2d1405]" />
                  <span className="w-1.5 h-3 bg-[#2d1405]" />
                  <span className="w-1.5 h-3 bg-[#2d1405]" />
                  <span className="w-1.5 h-3 bg-[#2d1405]" />
                </div>
              </div>

              {/* Equipped Rod & Bait Info Card */}
              <div className="mt-3 bg-[#0d1d2f] pixel-box border-sky-900 p-2.5 text-xs text-sky-100 flex items-center gap-2.5">
                <span className="text-2xl">{equippedRod.icon}</span>
                <div>
                  <div className="font-pixel text-[10px] text-sky-300">{equippedRod.name}</div>
                  <div className="font-vt323 text-base text-gray-300 mt-0.5">
                    May man: <span className="text-yellow-400 font-bold">+{equippedRod.luckBonus}%</span> | Moi: <span className="text-emerald-400 font-bold">{baitCount} con</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Fishing Pond Stage & Action Center */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 bg-[#0a1826] pixel-box border-sky-900 min-h-[260px] text-center relative">
              {/* IDLE STATE: Ready to cast */}
              {fishingState === 'idle' && (
                <div className="flex flex-col items-center gap-3 animate-in fade-in duration-200">
                  <div className="text-5xl animate-bounce">🎣</div>
                  <h3 className="font-pixel text-xs sm:text-sm text-sky-200">
                    Mat Ho Dang Tinh Lang
                  </h3>
                  <p className="font-vt323 text-base text-sky-300/80 max-w-xs">
                    Mac moi vao luoi cau va quang can ra xa. Ca ro phi, ca chep vang va ca rong dang luon duoi nuoc!
                  </p>
                  <button
                    onClick={handleCastLine}
                    className="pixel-btn bg-sky-600 hover:bg-sky-500 text-white font-pixel text-[11px] px-5 py-2.5 flex items-center gap-2 mt-2"
                  >
                    <span>QUANG CAN CAU</span>
                    <span className="text-[9px] text-sky-200">(-2 The luc)</span>
                  </button>
                </div>
              )}

              {/* WAITING STATE: Bobber in water, waiting for bite */}
              {fishingState === 'waiting' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="text-5xl">🫧</div>
                    <div className="absolute -bottom-1 -right-1 text-2xl animate-bounce">
                      🐟
                    </div>
                  </div>
                  <h3 className="font-pixel text-xs text-sky-200">
                    Dang Doi Ca Can Cau...
                  </h3>
                  <p className="font-vt323 text-base text-sky-300 animate-pulse">
                    Mat nuoc dang lan tan... Giu tap trung va chu y phao cau!
                  </p>
                  <div className="w-36 h-3 pixel-progress-track relative overflow-hidden">
                    <div className="h-full bg-sky-400 pixel-progress-fill animate-pulse w-full" />
                  </div>
                </div>
              )}

              {/* BITING STATE: Urgent alert to hook */}
              {fishingState === 'biting' && (
                <div className="flex flex-col items-center gap-3 animate-bounce">
                  <div className="text-5xl">🚨</div>
                  <h3 className="font-pixel text-xs sm:text-sm text-yellow-300 uppercase tracking-wider animate-pulse">
                    PHAO RUNG! CA DOP MOI!
                  </h3>
                  <p className="font-vt323 text-base text-yellow-200">
                    BAM NHANH NUT DUOI DE MAC LUOI CAU!
                  </p>
                  <button
                    onClick={handleHookFish}
                    className="pixel-btn bg-red-600 hover:bg-red-500 text-white font-pixel text-xs px-6 py-3 animate-pulse"
                  >
                    GIAT CAN NGAY!
                  </button>
                </div>
              )}

              {/* REELING STATE: Timing Mini-game Bar */}
              {fishingState === 'reeling' && (
                <div className="w-full max-w-sm flex flex-col items-center gap-3">
                  <h3 className="font-pixel text-xs text-yellow-300">
                    CA DANG QUAY! GIU NHIP DAY!
                  </h3>
                  <p className="font-vt323 text-base text-sky-200">
                    Canh con tro roi dung vao <span className="text-emerald-400 font-bold">VUNG XANH</span> roi bam KEO!
                  </p>

                  {/* Meter Track */}
                  <div className="w-full h-8 pixel-progress-track relative overflow-hidden flex items-center">
                    {/* Target Safe Zone */}
                    <div
                      className="absolute top-0 bottom-0 bg-emerald-500 border-x-2 border-white/80"
                      style={{
                        left: `${targetRange.min}%`,
                        width: `${targetRange.max - targetRange.min}%`,
                      }}
                    />

                    {/* Indicator pointer */}
                    <div
                      className="absolute top-0 bottom-0 w-3 bg-yellow-300 border-2 border-black transform -translate-x-1/2"
                      style={{ left: `${meterPosition}%` }}
                    />
                  </div>

                  <button
                    onClick={handleStrike}
                    className="pixel-btn bg-emerald-600 hover:bg-emerald-500 text-white font-pixel text-xs px-6 py-2.5 w-full mt-1"
                  >
                    KEO LEN BO!
                  </button>
                </div>
              )}

              {/* MISSED STATE */}
              {fishingState === 'missed' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="text-5xl">💨</div>
                  <h3 className="font-pixel text-xs text-rose-300">
                    Ca Da Song Mat Roi!
                  </h3>
                  <p className="font-vt323 text-base text-gray-300">
                    Ca nhanh hon mot buoc hoac ban giat lech nhip. Dung nan long, hay thu lai!
                  </p>
                  <button
                    onClick={() => setFishingState('idle')}
                    className="pixel-btn bg-sky-700 hover:bg-sky-600 text-white font-pixel text-[10px] px-4 py-2"
                  >
                    Thu Lai Lan Nua
                  </button>
                </div>
              )}

              {/* CAUGHT STATE */}
              {fishingState === 'caught' && caughtFish && (
                <div className="flex flex-col items-center gap-2 p-3 bg-[#170a04] pixel-box-gold w-full animate-in zoom-in duration-150">
                  <div className="text-5xl filter drop-shadow animate-bounce">
                    {caughtFish.fish.icon}
                  </div>
                  <div className="bg-yellow-400 text-black font-pixel text-[8px] px-2 py-0.5 border border-black uppercase">
                    CAU DUOC {caughtFish.fish.rarity.toUpperCase()}!
                  </div>
                  <h3 className="font-pixel text-sm text-yellow-200">
                    {caughtFish.fish.name}
                  </h3>
                  <div className="font-vt323 text-base text-sky-200">
                    Can nang: <span className="font-bold text-white">{caughtFish.weight} kg</span> | Tri gia: <span className="font-bold text-yellow-400">{caughtFish.fish.sellPrice} Xu</span>
                  </div>

                  {/* Decision buttons: Sell now or Grill for Energy */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    <button
                      onClick={handleQuickSell}
                      className="pixel-btn bg-yellow-500 hover:bg-yellow-400 text-black font-pixel text-[9px] px-2.5 py-1.5 flex items-center gap-1"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Ban (+{caughtFish.fish.sellPrice} Xu)</span>
                    </button>

                    <button
                      onClick={handleGrillFish}
                      className="pixel-btn bg-orange-600 hover:bg-orange-500 text-white font-pixel text-[9px] px-2.5 py-1.5 flex items-center gap-1"
                    >
                      <Flame className="w-3.5 h-3.5 text-yellow-200" />
                      <span>Nuong (+35 The luc)</span>
                    </button>

                    <button
                      onClick={() => {
                        setFishingState('idle');
                        setCaughtFish(null);
                      }}
                      className="pixel-btn bg-sky-800 hover:bg-sky-700 text-sky-100 font-pixel text-[9px] px-2.5 py-1.5"
                    >
                      Cat Vao Ruong
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fish Species Encyclopedia Mini-Bar */}
          <div className="mt-6 border-t-2 border-sky-950 pt-3">
            <h4 className="font-pixel text-[10px] text-sky-300 mb-2.5 flex items-center gap-1.5">
              <span>🐟 Danh Sach Ca Co The Cau Duoc Tai Ho:</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {FISH_SPECIES.map((fish) => (
                <div
                  key={fish.id}
                  className="bg-[#091522] pixel-box border-sky-950 p-2 text-center flex flex-col items-center justify-between"
                >
                  <span className="text-2xl">{fish.icon}</span>
                  <span className="font-pixel text-[8px] text-sky-100 truncate max-w-full mt-1">
                    {fish.name}
                  </span>
                  <span className="font-pixel text-[8px] text-yellow-400 mt-0.5">
                    {fish.sellPrice} Xu
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
