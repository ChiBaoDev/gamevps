import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Dices, 
  Sparkles, 
  Coins, 
  RotateCw, 
  History,
  Timer,
  Users,
  Flame,
  Volume2,
  Trophy
} from 'lucide-react';
import { BauCuaBowl } from './BauCuaBowl';

interface MiniGameAreaProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onShowMessage: (msg: string) => void;
}

type BauCuaChoice = 'bau' | 'cua' | 'tom' | 'ca' | 'ga' | 'nai';

const BAU_CUA_ITEMS: { id: BauCuaChoice; name: string; icon: string; color: string; bgBadge: string }[] = [
  { id: 'bau', name: 'Bầu', icon: '🍐', color: 'from-amber-600 to-amber-800', bgBadge: 'bg-amber-500' },
  { id: 'cua', name: 'Cua', icon: '🦀', color: 'from-rose-600 to-red-800', bgBadge: 'bg-rose-500' },
  { id: 'tom', name: 'Tôm', icon: '🦐', color: 'from-orange-600 to-orange-800', bgBadge: 'bg-orange-500' },
  { id: 'ca', name: 'Cá', icon: '🐟', color: 'from-sky-600 to-blue-800', bgBadge: 'bg-sky-500' },
  { id: 'ga', name: 'Gà', icon: '🐓', color: 'from-yellow-600 to-yellow-800', bgBadge: 'bg-yellow-500' },
  { id: 'nai', name: 'Nai', icon: '🦌', color: 'from-emerald-700 to-green-900', bgBadge: 'bg-emerald-600' },
];

const MASCOT_MAP = BAU_CUA_ITEMS.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {} as Record<string, typeof BAU_CUA_ITEMS[0]>);

const WHEEL_REWARDS = [
  { id: 'xu_300', text: '300 Xu', type: 'xu', amount: 300, icon: '🪙', color: '#eab308' },
  { id: 'xu_800', text: '800 Xu', type: 'xu', amount: 800, icon: '💰', color: '#f59e0b' },
  { id: 'luong_3', text: '3 Lượng', type: 'luong', amount: 3, icon: '💎', color: '#c084fc' },
  { id: 'xu_2000', text: '2,000 Xu', type: 'xu', amount: 2000, icon: '👑', color: '#e11d48' },
  { id: 'luong_8', text: '8 Lượng', type: 'luong', amount: 8, icon: '✨', color: '#a855f7' },
  { id: 'seeds', text: 'Hạt Dâu Tây', type: 'item', icon: '🍓', color: '#10b981' },
  { id: 'bait_magic', text: '3 Mồi Thần', type: 'bait', icon: '🔮', color: '#3b82f6' },
  { id: 'wings', text: 'Cánh Thiên Thần', type: 'wings', icon: '🪽', color: '#fbbf24' },
];

export const MiniGameArea: React.FC<MiniGameAreaProps> = ({
  user,
  onUpdateUser,
  onShowMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'baucua' | 'wheel'>('baucua');

  // Realtime Bầu Cua State
  const [phase, setPhase] = useState<'BETTING' | 'SHAKING' | 'PEEKING' | 'PAYOUT'>('BETTING');
  const [remainingSec, setRemainingSec] = useState<number>(25);
  const [roundId, setRoundId] = useState<number>(0);
  const [dice, setDice] = useState<string[] | null>(null);
  const [totalBets, setTotalBets] = useState<Record<string, number>>({
    bau: 0, cua: 0, tom: 0, ca: 0, ga: 0, nai: 0
  });
  const [myBets, setMyBets] = useState<Record<BauCuaChoice, number>>({
    bau: 0, cua: 0, tom: 0, ca: 0, ga: 0, nai: 0
  });
  const [history, setHistory] = useState<{ id: number; dice: string[]; time: string }[]>([]);
  const [chipAmount, setChipAmount] = useState<number>(50);
  const [lastWinAmount, setLastWinAmount] = useState<number | null>(null);
  const [isSubmittingBet, setIsSubmittingBet] = useState<boolean>(false);

  // Wheel State
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelResult, setWheelResult] = useState<string | null>(null);

  const prevPhaseRef = useRef(phase);

  // Poll state / WebSocket state listener
  useEffect(() => {
    let isMounted = true;

    const fetchState = async () => {
      try {
        const token = localStorage.getItem('game_auth_token') || '';
        const res = await fetch(`/api/game/baucua/state?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setPhase(data.phase);
            setRemainingSec(data.remainingSec);
            setRoundId(data.roundId);
            if (data.dice) setDice(data.dice);
            if (data.totalBets) setTotalBets(data.totalBets);
            if (data.myBets) setMyBets(data.myBets);
            if (data.history) setHistory(data.history);
          }
        }
      } catch (e) {
        // Fallback gracefully
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Detect phase transitions for sounds and confetti
  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      if (phase === 'SHAKING') {
        sounds.playDiceRoll();
      } else if (phase === 'PAYOUT') {
        // Check if player won
        const totalWon = calculateMyWinnings();
        if (totalWon > 0) {
          setLastWinAmount(totalWon);
          sounds.playWin();
          try {
            confetti({ particleCount: 70, spread: 90, origin: { y: 0.6 } });
          } catch {}
          onShowMessage(`🎉 THẮNG LỚN! Bạn nhận được ${totalWon.toLocaleString('vi-VN')} Xu từ Bầu Cua!`);
          
          // Refresh user balance
          const token = localStorage.getItem('game_auth_token') || '';
          fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (d.success) onUpdateUser(d.user); });
        } else {
          setLastWinAmount(0);
        }
      } else if (phase === 'BETTING') {
        // New round reset
        setMyBets({ bau: 0, cua: 0, tom: 0, ca: 0, ga: 0, nai: 0 });
        setLastWinAmount(null);
      }
      prevPhaseRef.current = phase;
    }
  }, [phase]);

  const calculateMyWinnings = () => {
    if (!dice || dice.length !== 3) return 0;
    let won = 0;
    BAU_CUA_ITEMS.forEach((item) => {
      const bet = myBets[item.id] || 0;
      if (bet > 0) {
        const matches = dice.filter((d) => d === item.id).length;
        if (matches > 0) {
          won += bet + (bet * matches);
        }
      }
    });
    return won;
  };

  const myTotalBet = Object.values(myBets).reduce((a, b) => a + b, 0);

  // Place bet on a mascot
  const handlePlaceBet = async (choice: BauCuaChoice) => {
    if (phase !== 'BETTING') {
      onShowMessage('⏳ Đang trong thời gian lắc/mở bát, vui lòng chờ vòng cược mới!');
      return;
    }

    if (user.xu < chipAmount) {
      sounds.playClick();
      onShowMessage(`❌ Bạn không đủ Xu để đặt thêm cược ${chipAmount} Xu!`);
      return;
    }

    if (isSubmittingBet) return;
    setIsSubmittingBet(true);
    sounds.playCoin();

    try {
      const token = localStorage.getItem('game_auth_token') || '';
      const res = await fetch('/api/game/baucua/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mascot: choice, amount: chipAmount }),
      });

      const data = await res.json();
      if (data.success) {
        setMyBets((prev) => ({
          ...prev,
          [choice]: prev[choice] + chipAmount,
        }));
        onUpdateUser({ xu: data.newBalance });
      } else {
        onShowMessage(`❌ ${data.error || 'Không thể đặt cược'}`);
      }
    } catch (e) {
      onShowMessage('Lỗi kết nối máy chủ khi cược.');
    } finally {
      setIsSubmittingBet(false);
    }
  };

  // Spin Lucky Wheel
  const handleSpinWheel = () => {
    if (isSpinning) return;
    const spinCost = 100;

    if (user.xu < spinCost) {
      onShowMessage(`Bạn cần 100 Xu để quay Vòng Quay Hoàng Kim!`);
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
    const fullSpins = 360 * (5 + Math.floor(Math.random() * 2));
    const targetDeg = wheelRotation + fullSpins + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));

    setWheelRotation(targetDeg);

    setTimeout(() => {
      setIsSpinning(false);
      sounds.playWin();
      try {
        confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
      } catch {}
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
        else updatedInv.push({ id: 'strawberry_seed', name: 'Hạt Giống Dâu Tây', type: 'seed', count: 2, sellPrice: 150, icon: '🍓', description: 'Hạt giống quý tộc' });
        onUpdateUser({ inventory: updatedInv });
      } else if (prize.type === 'bait') {
        const updatedInv = [...user.inventory];
        const existIdx = updatedInv.findIndex((i) => i.id === 'bait_magic');
        if (existIdx >= 0) updatedInv[existIdx].count += 3;
        else updatedInv.push({ id: 'bait_magic', name: 'Mồi Thần Kỳ Lôi Ngư', type: 'bait', count: 3, sellPrice: 50, icon: '🔮', description: 'Mồi săn thủy quái' });
        onUpdateUser({ inventory: updatedInv });
      } else if (prize.type === 'wings') {
        onUpdateUser({
          appearance: { ...user.appearance, wings: 'angel' },
        });
      }

      onShowMessage(`🎁 Chúc mừng! Bạn quay trúng: ${prize.text}!`);
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
                Sòng Bài Dân Gian Realtime
              </h1>
              <p className="font-vt323 text-base text-purple-300/80">
                Lắc Bầu Cua Tôm Cá đồng bộ nhiều người chơi & Vòng Quay Hoàng Kim!
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
              🎲 Bầu Cua Dân Gian
            </button>
            <button
              onClick={() => { sounds.playClick(); setActiveTab('wheel'); }}
              className={`pixel-btn px-2.5 py-1 text-[9px] font-pixel transition-all ${
                activeTab === 'wheel'
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-[#2a0c3b] text-purple-300 hover:text-white'
              }`}
            >
              🎡 Vòng Quay Vàng
            </button>
          </div>
        </div>

        {/* TAB 1: BẦU CUA REALTIME MULTIPLAYER */}
        {activeTab === 'baucua' && (
          <div className="bg-[#1c0827] pixel-box p-4 sm:p-5 shadow-2xl">
            
            {/* Top Status & Phase Countdown Bar */}
            <div className="bg-[#12041a] pixel-box p-3 mb-4 flex flex-wrap items-center justify-between gap-2 border-purple-900">
              <div className="flex items-center gap-2.5">
                <span className="font-pixel text-[9px] text-yellow-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                  <span>TRẠNG THÁI:</span>
                </span>
                
                <span className={`font-pixel text-[10px] px-2.5 py-0.5 rounded shadow ${
                  phase === 'BETTING'
                    ? 'bg-emerald-700 text-emerald-100 animate-pulse'
                    : phase === 'SHAKING'
                      ? 'bg-purple-800 text-purple-100 animate-bounce'
                      : phase === 'PEEKING'
                        ? 'bg-amber-600 text-amber-100 animate-pulse'
                        : 'bg-yellow-500 text-black font-bold'
                }`}>
                  {phase === 'BETTING' && '🟢 ĐANG MỞ CƯỢC'}
                  {phase === 'SHAKING' && '🟣 ĐANG LẮC ĐĨA'}
                  {phase === 'PEEKING' && '🟡 NẶN BÁT'}
                  {phase === 'PAYOUT' && '👑 MỞ BÁT & TRẢ THƯỞNG'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Countdown timer */}
                <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded border border-yellow-500/50">
                  <Timer className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                  <span className="font-pixel text-xs text-yellow-300 font-bold">
                    {remainingSec}s
                  </span>
                </div>

                {/* Village total pot */}
                <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded border border-amber-500/40">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-pixel text-[9px] text-amber-200">
                    Làng cược: {Object.values(totalBets).reduce((a, b) => a + b, 0).toLocaleString('vi-VN')} Xu
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Bowl & Plate Area */}
            <div className="bg-[#100317] pixel-box-gold p-4 mb-4 flex flex-col items-center justify-center relative overflow-hidden">
              <BauCuaBowl 
                phase={phase}
                remainingSec={remainingSec}
                dice={dice}
                mascotInfo={MASCOT_MAP}
              />
            </div>

            {/* 6 Mascot Betting Board Cells */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-4">
              {BAU_CUA_ITEMS.map((item) => {
                const myBet = myBets[item.id] || 0;
                const villageBet = totalBets[item.id] || 0;
                const isWinner = (phase === 'PAYOUT' || phase === 'PEEKING') && dice && dice.includes(item.id);
                const matchCount = dice ? dice.filter(d => d === item.id).length : 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => handlePlaceBet(item.id)}
                    className={`pixel-plot ${item.color} p-3 cursor-pointer select-none relative flex flex-col items-center justify-between min-h-[110px] transition-all transform hover:scale-[1.02] active:scale-95 ${
                      isWinner ? 'ring-4 ring-yellow-400 animate-pulse shadow-[0_0_20px_rgba(250,204,21,0.6)]' : ''
                    }`}
                  >
                    {/* Multiplier Badge if multiple matches */}
                    {isWinner && matchCount > 1 && (
                      <div className="absolute top-1.5 left-1.5 bg-red-600 text-white font-pixel text-[8px] px-1.5 py-0.5 rounded shadow animate-bounce border border-yellow-300">
                        x{matchCount}
                      </div>
                    )}

                    {/* My Bet Badge */}
                    {myBet > 0 && (
                      <div className="absolute top-1.5 right-1.5 bg-yellow-400 border border-black text-black font-pixel text-[8.5px] px-1.5 py-0.5 shadow flex items-center gap-0.5 animate-bounce">
                        <Coins className="w-2.5 h-2.5" />
                        <span>{myBet.toLocaleString('vi-VN')}</span>
                      </div>
                    )}

                    <span className="text-4xl sm:text-5xl my-1 filter drop-shadow">
                      {item.icon}
                    </span>

                    <div className="text-center w-full">
                      <span className="font-pixel text-[10px] text-white tracking-wide uppercase block">
                        {item.name}
                      </span>
                      <div className="flex items-center justify-between text-[8px] font-pixel text-yellow-200/90 mt-1 bg-black/40 px-2 py-0.5 rounded">
                        <span>Làng: {villageBet}</span>
                        <span>{myBet > 0 ? `Tôi: ${myBet}` : 'Cược'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bet Controls & Chip Selector */}
            <div className="bg-[#12041a] p-3 pixel-box border-purple-950 flex flex-wrap items-center justify-between gap-3 mb-4">
              {/* Chip amount selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-pixel text-[9px] text-purple-200 mr-1">CHỌN PHỈNH:</span>
                {[20, 50, 100, 200, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { sounds.playClick(); setChipAmount(amount); }}
                    className={`pixel-btn px-2.5 py-1 text-[9px] font-pixel transition-all ${
                      chipAmount === amount
                        ? 'bg-yellow-400 text-black border-yellow-200 shadow-md scale-105'
                        : 'bg-purple-950 text-purple-200 hover:bg-purple-900'
                    }`}
                  >
                    {amount >= 1000 ? `${amount / 1000}k` : amount}
                  </button>
                ))}
              </div>

              {/* Total User Bet in this round */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-pixel text-[8px] text-purple-300 block">TỔNG CƯỢC CỦA BẠN:</span>
                  <span className="font-pixel text-xs text-yellow-400">
                    {myTotalBet.toLocaleString('vi-VN')} Xu
                  </span>
                </div>
              </div>
            </div>

            {/* History Table (Soi Cầu Bầu Cua) */}
            <div className="bg-[#100317] p-3 pixel-box border-purple-900">
              <div className="flex items-center justify-between mb-2">
                <span className="font-pixel text-[9px] text-yellow-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-yellow-400" />
                  <span>LỊCH SỬ KẾT QUẢ CÁC VÁN GẦN ĐÂY</span>
                </span>
                <span className="font-vt323 text-sm text-purple-300">
                  12 ván trước
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {history.length === 0 ? (
                  <span className="font-vt323 text-sm text-gray-400">Đang cập nhật lịch sử vòng chơi...</span>
                ) : (
                  history.map((h, idx) => (
                    <div
                      key={idx}
                      className="bg-[#1f092b] border border-purple-800/60 p-1.5 rounded flex items-center gap-1 flex-shrink-0"
                    >
                      {h.dice.map((d, dIdx) => (
                        <span key={dIdx} className="text-base filter drop-shadow">
                          {MASCOT_MAP[d]?.icon || '🎲'}
                        </span>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VÒNG QUAY HOÀNG KIM */}
        {activeTab === 'wheel' && (
          <div className="bg-[#1c0827] pixel-box p-4 sm:p-6 flex flex-col items-center">
            <h3 className="font-pixel text-xs sm:text-sm text-yellow-300 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>VÒNG QUAY HOÀNG KIM</span>
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </h3>
            <p className="font-vt323 text-base text-purple-300/80 mb-4 text-center max-w-md">
              Mỗi lượt quay tốn 100 Xu. Cơ hội trúng 2,000 Xu, 8 Lượng, Hạt giống dâu tây hoặc Cánh thiên thần!
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
                <span>{isSpinning ? 'ĐANG QUAY...' : 'QUAY (100 XU)'}</span>
              </button>

              {wheelResult && (
                <div className="bg-[#12041a] pixel-box border-yellow-500 font-pixel text-[9px] text-yellow-300 px-3 py-1.5 mt-2 animate-bounce">
                  🎉 Trúng: {wheelResult}!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
