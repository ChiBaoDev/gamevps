import React, { useState } from 'react';
import { UserProfile } from '../types';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Dices, 
  Sparkles, 
  Coins, 
  Gem, 
  RotateCw, 
  Trophy,
  History,
  AlertCircle
} from 'lucide-react';

interface MiniGameAreaProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onShowMessage: (msg: string) => void;
}

type BauCuaChoice = 'bau' | 'cua' | 'tom' | 'ca' | 'ga' | 'nai';

const BAU_CUA_ITEMS: { id: BauCuaChoice; name: string; icon: string; color: string }[] = [
  { id: 'bau', name: 'Bau', icon: '🍐', color: 'from-amber-600 to-amber-800' },
  { id: 'cua', name: 'Cua', icon: '🦀', color: 'from-rose-600 to-red-800' },
  { id: 'tom', name: 'Tom', icon: '🦐', color: 'from-orange-600 to-orange-800' },
  { id: 'ca', name: 'Ca', icon: '🐟', color: 'from-sky-600 to-blue-800' },
  { id: 'ga', name: 'Ga', icon: '🐓', color: 'from-yellow-600 to-yellow-800' },
  { id: 'nai', name: 'Nai', icon: '🦌', color: 'from-emerald-700 to-green-900' },
];

const WHEEL_REWARDS = [
  { id: 'xu_300', text: '300 Xu', type: 'xu', amount: 300, icon: '🪙', color: '#eab308' },
  { id: 'xu_800', text: '800 Xu', type: 'xu', amount: 800, icon: '💰', color: '#f59e0b' },
  { id: 'luong_3', text: '3 Luong', type: 'luong', amount: 3, icon: '💎', color: '#c084fc' },
  { id: 'xu_2000', text: '2,000 Xu', type: 'xu', amount: 2000, icon: '👑', color: '#e11d48' },
  { id: 'luong_8', text: '8 Luong', type: 'luong', amount: 8, icon: '✨', color: '#a855f7' },
  { id: 'seeds', text: 'Hat Dau Tay', type: 'item', icon: '🍓', color: '#10b981' },
  { id: 'bait_magic', text: '3 Moi Than', type: 'bait', icon: '🔮', color: '#3b82f6' },
  { id: 'wings', text: 'Canh Thien Than', type: 'wings', icon: '🪽', color: '#fbbf24' },
];

export const MiniGameArea: React.FC<MiniGameAreaProps> = ({
  user,
  onUpdateUser,
  onShowMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'baucua' | 'wheel'>('baucua');

  // Bầu Cua State
  const [bets, setBets] = useState<Record<BauCuaChoice, number>>({
    bau: 0,
    cua: 0,
    tom: 0,
    ca: 0,
    ga: 0,
    nai: 0,
  });
  const [chipAmount, setChipAmount] = useState<number>(50);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [diceResults, setDiceResults] = useState<BauCuaChoice[]>(['bau', 'cua', 'tom']);
  const [lastWinAmount, setLastWinAmount] = useState<number | null>(null);

  // Wheel State
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelResult, setWheelResult] = useState<string | null>(null);

  const totalBet = (Object.values(bets) as number[]).reduce((a: number, b: number) => a + b, 0);

  // Place bet on a symbol
  const handlePlaceBet = (choice: BauCuaChoice) => {
    if (isRolling) return;
    if (user.xu < totalBet + chipAmount) {
      sounds.playClick();
      onShowMessage(`Ban khong du Xu de dat them cuoc ${chipAmount} Xu!`);
      return;
    }

    sounds.playCoin();
    setBets((prev) => ({
      ...prev,
      [choice]: prev[choice] + chipAmount,
    }));
  };

  // Clear bets
  const handleClearBets = () => {
    if (isRolling) return;
    sounds.playClick();
    setBets({ bau: 0, cua: 0, tom: 0, ca: 0, ga: 0, nai: 0 });
    setLastWinAmount(null);
  };

  // Roll Bầu Cua
  const handleRollBauCua = () => {
    if (isRolling) return;
    if (totalBet <= 0) {
      onShowMessage('Hay chon cac o linh vat de dat cuoc truoc khi xoc dia!');
      return;
    }
    if (user.xu < totalBet) {
      onShowMessage('Ban khong du so du Xu!');
      return;
    }

    sounds.playDiceRoll();
    setIsRolling(true);
    setLastWinAmount(null);

    // Deduct bet initially
    const newBalance = user.xu - totalBet;
    onUpdateUser({ xu: newBalance });

    // Shaking simulation
    setTimeout(() => {
      // Pick 3 random dice
      const choices: BauCuaChoice[] = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
      const d1 = choices[Math.floor(Math.random() * choices.length)];
      const d2 = choices[Math.floor(Math.random() * choices.length)];
      const d3 = choices[Math.floor(Math.random() * choices.length)];
      const results = [d1, d2, d3];
      setDiceResults(results);

      // Calculate winnings:
      // If dice shows symbol, player gets back original bet + (match count * bet)
      let totalWon = 0;
      choices.forEach((choice) => {
        const betOnChoice = bets[choice];
        if (betOnChoice > 0) {
          const matchCount = results.filter((r) => r === choice).length;
          if (matchCount > 0) {
            // win refund + payout
            totalWon += betOnChoice + (betOnChoice * matchCount);
          }
        }
      });

      setIsRolling(false);
      setLastWinAmount(totalWon);

      // Update user state
      if (totalWon > 0) {
        sounds.playWin();
        try {
          confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
        } catch {
          // Ignored
        }

        // Check quest progress
        const updatedQuests = user.quests.map((q) => {
          if (q.id === 'quest_casino') {
            const newProg = Math.min(q.target, q.progress + 1);
            return { ...q, progress: newProg, completed: newProg >= q.target };
          }
          return q;
        });

        onUpdateUser({
          xu: newBalance + totalWon,
          quests: updatedQuests,
          stats: {
            ...user.stats,
            miniGamesPlayed: user.stats.miniGamesPlayed + 1,
            miniGamesWon: user.stats.miniGamesWon + 1,
            moneyEarned: user.stats.moneyEarned + totalWon,
          },
        });
        onShowMessage(`🎉 THANG LON! Ban da thu ve ${totalWon} Xu tu song Bau Cua!`);
      } else {
        sounds.playClick();
        onUpdateUser({
          stats: {
            ...user.stats,
            miniGamesPlayed: user.stats.miniGamesPlayed + 1,
          },
        });
        onShowMessage(`Truot roi! Ket qua la: ${d1.toUpperCase()} - ${d2.toUpperCase()} - ${d3.toUpperCase()}. Thu lai may man nhe!`);
      }
    }, 1800);
  };

  // Spin Lucky Wheel
  const handleSpinWheel = () => {
    if (isSpinning) return;
    const spinCost = 100;

    if (user.xu < spinCost) {
      onShowMessage(`Ban can 100 Xu de quay Vong Quay May Man!`);
      return;
    }

    sounds.playDiceRoll();
    setIsSpinning(true);
    setWheelResult(null);

    // Deduct spin cost
    onUpdateUser({ xu: user.xu - spinCost });

    // Pick a reward index (0 to 7)
    const prizeIndex = Math.floor(Math.random() * WHEEL_REWARDS.length);
    const prize = WHEEL_REWARDS[prizeIndex];

    // Compute target rotation
    const segmentAngle = 360 / WHEEL_REWARDS.length;
    // Extra full spins: 5 to 7 full circles
    const fullSpins = 360 * (5 + Math.floor(Math.random() * 2));
    const targetDeg = wheelRotation + fullSpins + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));

    setWheelRotation(targetDeg);

    setTimeout(() => {
      setIsSpinning(false);
      sounds.playWin();
      try {
        confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
      } catch {
        // Ignored
      }
      setWheelResult(prize.text);

      // Reward distribution
      if (prize.type === 'xu') {
        onUpdateUser({ xu: user.xu - spinCost + (prize.amount || 0) });
      } else if (prize.type === 'luong') {
        onUpdateUser({ luong: user.luong + (prize.amount || 0) });
      } else if (prize.type === 'item') {
        const updatedInv = [...user.inventory];
        const existIdx = updatedInv.findIndex((i) => i.id === 'strawberry_seed');
        if (existIdx >= 0) updatedInv[existIdx].count += 2;
        else updatedInv.push({ id: 'strawberry_seed', name: 'Hat Giong Dau Tay', type: 'seed', count: 2, sellPrice: 150, icon: '🍓', description: 'Hat giong quy toc' });
        onUpdateUser({ inventory: updatedInv });
      } else if (prize.type === 'bait') {
        const updatedInv = [...user.inventory];
        const existIdx = updatedInv.findIndex((i) => i.id === 'bait_magic');
        if (existIdx >= 0) updatedInv[existIdx].count += 3;
        else updatedInv.push({ id: 'bait_magic', name: 'Moi Than Ky Loi Ngu', type: 'bait', count: 3, sellPrice: 50, icon: '🔮', description: 'Moi san thuy quai' });
        onUpdateUser({ inventory: updatedInv });
      } else if (prize.type === 'wings') {
        onUpdateUser({
          appearance: { ...user.appearance, wings: 'angel' },
        });
      }

      onShowMessage(`🎁 Chuc mung! Ban quay trung: ${prize.text}!`);
    }, 4200);
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] pb-24 pt-4 px-2 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Banner Header */}
        <div className="bg-[#260e33] pixel-box p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl filter drop-shadow">🎰</span>
            <div>
              <h1 className="text-base sm:text-lg font-black text-purple-200 tracking-wide uppercase font-pixel flex items-center gap-2 pixel-shadow-sm">
                Khu Giai Tri Song Bai
              </h1>
              <p className="font-vt323 text-base text-purple-300/80">
                Thu van may voi Bau Cua Tom Ca truyen thong va Vong Quay Hoang Kim!
              </p>
            </div>
          </div>

          {/* Sub-tab selection */}
          <div className="flex items-center gap-2 bg-[#14061d] p-1 border-2 border-purple-900">
            <button
              onClick={() => { sounds.playClick(); setActiveTab('baucua'); }}
              className={`pixel-btn px-2.5 py-1 text-[9px] font-pixel transition-all ${
                activeTab === 'baucua'
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-[#2a0c3b] text-purple-300 hover:text-white'
              }`}
            >
              🎲 Bau Cua Tom Ca
            </button>
            <button
              onClick={() => { sounds.playClick(); setActiveTab('wheel'); }}
              className={`pixel-btn px-2.5 py-1 text-[9px] font-pixel transition-all ${
                activeTab === 'wheel'
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-[#2a0c3b] text-purple-300 hover:text-white'
              }`}
            >
              🎡 Vong Quay Vang
            </button>
          </div>
        </div>

        {/* TAB 1: BẦU CUA TÔM CÁ */}
        {activeTab === 'baucua' && (
          <div className="bg-[#1c0827] pixel-box p-4 sm:p-5 shadow-2xl">
            {/* Shaking Bowl & Dice Display */}
            <div className="bg-[#12041a] pixel-box-gold p-3.5 mb-5 flex flex-col items-center justify-center relative overflow-hidden">
              <span className="font-pixel text-[9px] text-yellow-400 tracking-widest mb-2">
                BAT XOC DIA AVATAR
              </span>

              {/* Rolling Animation or Result Dice */}
              <div className="flex items-center justify-center gap-3 my-2">
                {isRolling ? (
                  <div className="flex gap-3 items-center">
                    <div className="w-14 h-14 bg-purple-950 border-2 border-yellow-400 flex items-center justify-center text-3xl animate-spin">
                      🎲
                    </div>
                    <div className="w-14 h-14 bg-purple-950 border-2 border-yellow-400 flex items-center justify-center text-3xl animate-bounce">
                      🎲
                    </div>
                    <div className="w-14 h-14 bg-purple-950 border-2 border-yellow-400 flex items-center justify-center text-3xl animate-spin">
                      🎲
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 items-center">
                    {diceResults.map((result, idx) => {
                      const item = BAU_CUA_ITEMS.find((i) => i.id === result);
                      return (
                        <div
                          key={idx}
                          className="w-14 h-14 sm:w-16 sm:h-16 bg-[#fff2cc] border-3 border-[#261208] flex flex-col items-center justify-center shadow-lg"
                        >
                          <span className="text-2xl sm:text-3xl filter drop-shadow">{item?.icon}</span>
                          <span className="font-pixel text-[7px] text-amber-950 uppercase mt-0.5">
                            {item?.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status Banner */}
              <div className="mt-2 text-center">
                {isRolling ? (
                  <span className="font-pixel text-[10px] text-yellow-300 animate-pulse">
                    Dang xoc dia lac xuc xac... Cho mo bat!
                  </span>
                ) : lastWinAmount !== null ? (
                  lastWinAmount > 0 ? (
                    <span className="font-pixel text-[11px] text-emerald-400 animate-bounce">
                      🎉 Trung {lastWinAmount} Xu!
                    </span>
                  ) : (
                    <span className="font-pixel text-[9px] text-rose-300">
                      Khong trung o nao roi! Chuc ban may man lan sau.
                    </span>
                  )
                ) : (
                  <span className="font-vt323 text-base text-purple-300/90">
                    Chon muc cuoc va bam vao cac o linh vat ban tin se xuat hien!
                  </span>
                )}
              </div>
            </div>

            {/* 6 Betting Board Cells */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-5">
              {BAU_CUA_ITEMS.map((item) => {
                const betAmount = bets[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => handlePlaceBet(item.id)}
                    className={`pixel-plot ${item.color} p-3 cursor-pointer select-none relative flex flex-col items-center justify-between min-h-[105px]`}
                  >
                    {/* Bet badge on top */}
                    {betAmount > 0 && (
                      <div className="absolute top-1.5 right-1.5 bg-yellow-400 border border-black text-black font-pixel text-[8px] px-1.5 py-0.5 shadow flex items-center gap-0.5 animate-bounce">
                        <Coins className="w-2.5 h-2.5" />
                        <span>{betAmount}</span>
                      </div>
                    )}

                    <span className="text-4xl my-1 filter drop-shadow">
                      {item.icon}
                    </span>

                    <div className="text-center">
                      <span className="font-pixel text-[10px] text-white tracking-wide uppercase block">
                        {item.name}
                      </span>
                      <span className="font-vt323 text-sm text-yellow-200">
                        {betAmount > 0 ? `Cuoc: ${betAmount} Xu` : 'Cham de cuoc'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bet Controls & Action Buttons */}
            <div className="bg-[#12041a] p-3 pixel-box border-purple-950 flex flex-wrap items-center justify-between gap-3">
              {/* Chip amount selector */}
              <div className="flex items-center gap-1.5">
                <span className="font-pixel text-[9px] text-purple-200">Cuoc:</span>
                {[20, 50, 100, 200, 500].map((amount) => (
                  <button
                    key={amount}
                    disabled={isRolling}
                    onClick={() => { sounds.playClick(); setChipAmount(amount); }}
                    className={`pixel-btn px-2 py-1 text-[9px] font-pixel ${
                      chipAmount === amount
                        ? 'bg-yellow-400 text-black border-yellow-200'
                        : 'bg-purple-950 text-purple-200 hover:bg-purple-900'
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>

              {/* Total Bet & Action Buttons */}
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <span className="font-pixel text-[8px] text-purple-300 block">Tong:</span>
                  <span className="font-pixel text-xs text-yellow-400">
                    {totalBet} Xu
                  </span>
                </div>

                <button
                  disabled={isRolling || totalBet === 0}
                  onClick={handleClearBets}
                  className="pixel-btn bg-gray-800 hover:bg-gray-700 text-gray-300 font-pixel text-[9px] px-2.5 py-1.5"
                >
                  Xoa
                </button>

                <button
                  disabled={isRolling || totalBet === 0}
                  onClick={handleRollBauCua}
                  className={`pixel-btn font-pixel text-[10px] px-4 py-2 flex items-center gap-1.5 ${
                    isRolling || totalBet === 0
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-yellow-500 hover:bg-yellow-400 text-black animate-pulse'
                  }`}
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>{isRolling ? 'DANG XOC...' : 'MO BAT'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VÒNG QUAY MAY MẮN (LUCKY WHEEL) */}
        {activeTab === 'wheel' && (
          <div className="bg-[#1c0827] pixel-box p-4 sm:p-6 flex flex-col items-center">
            <h3 className="font-pixel text-xs sm:text-sm text-yellow-300 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>VONG QUAY HOANG KIM</span>
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </h3>
            <p className="font-vt323 text-base text-purple-300/80 mb-4 text-center max-w-md">
              Moi luot quay ton 100 Xu. Co hoi trung 2,000 Xu, 8 Luong, Hat giong dau tay hoac Canh thien than!
            </p>

            {/* Wheel graphic */}
            <div className="relative w-64 h-64 sm:w-76 sm:h-76 my-3 flex items-center justify-center">
              {/* Pointer at top */}
              <div className="absolute -top-3 z-30 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-yellow-400 filter drop-shadow-md" />

              {/* The spinning wheel circle */}
              <div
                className="w-full h-full rounded-full border-4 border-[#170a04] shadow-[0_0_20px_rgba(234,179,8,0.3)] relative overflow-hidden transition-transform duration-[4000ms] ease-out"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  background: 'conic-gradient(#eab308 0deg 45deg, #f59e0b 45deg 90deg, #c084fc 90deg 135deg, #e11d48 135deg 180deg, #a855f7 180deg 225deg, #10b981 225deg 270deg, #3b82f6 270deg 315deg, #fbbf24 315deg 360deg)',
                }}
              >
                {/* Visual Segments */}
                {WHEEL_REWARDS.map((item, index) => {
                  const angle = (index * 360) / WHEEL_REWARDS.length + 22.5;
                  return (
                    <div
                      key={item.id}
                      className="absolute w-full h-full top-0 left-0 flex items-start justify-center pt-2.5"
                      style={{
                        transform: `rotate(${angle}deg)`,
                        transformOrigin: '50% 50%',
                      }}
                    >
                      <div className="flex flex-col items-center select-none">
                        <span className="text-xl filter drop-shadow">{item.icon}</span>
                        <span className="font-pixel text-[8px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {item.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Wheel Center Hub */}
              <div className="absolute z-20 w-14 h-14 bg-yellow-400 border-3 border-black rounded-full flex flex-col items-center justify-center shadow-2xl">
                <span className="font-pixel text-[8px] text-black">AVATAR</span>
              </div>
            </div>

            {/* Spin Button */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                disabled={isSpinning}
                onClick={handleSpinWheel}
                className={`pixel-btn font-pixel text-xs px-6 py-2.5 flex items-center gap-2 ${
                  isSpinning
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-500 hover:bg-yellow-400 text-black'
                }`}
              >
                <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'DANG QUAY...' : 'QUAY (100 XU)'}</span>
              </button>

              {wheelResult && (
                <div className="bg-[#12041a] pixel-box border-yellow-500 font-pixel text-[9px] text-yellow-300 px-3 py-1.5 mt-2 animate-bounce">
                  🎉 Trung: {wheelResult}!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
