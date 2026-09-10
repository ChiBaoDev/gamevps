import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Eye, Hand } from 'lucide-react';
import { sounds } from '../utils/audio';

interface BauCuaBowlProps {
  phase: 'BETTING' | 'SHAKING' | 'PEEKING' | 'PAYOUT';
  remainingSec: number;
  dice: string[] | null; // e.g. ['bau', 'cua', 'tom']
  mascotInfo: Record<string, { id: string; name: string; icon: string; color: string }>;
}

export const BauCuaBowl: React.FC<BauCuaBowlProps> = ({
  phase,
  remainingSec,
  dice,
  mascotInfo,
}) => {
  // Drag offset for "nặn bát" (peeking)
  const [bowlOffset, setBowlOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset bowl position when phase changes
  useEffect(() => {
    if (phase === 'PEEKING') {
      setBowlOffset({ x: 0, y: 0 });
    } else if (phase === 'PAYOUT') {
      setBowlOffset({ x: 0, y: -160 }); // Fully lifted
    } else {
      setBowlOffset({ x: 0, y: 0 });
    }
  }, [phase]);

  // Touch / Mouse drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (phase !== 'PEEKING') return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startOffsetRef.current = { ...bowlOffset };
    sounds.playClick();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || phase !== 'PEEKING') return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    // Clamp movement (allow dragging up/down/left/right within bounds)
    const newX = Math.max(-140, Math.min(140, startOffsetRef.current.x + dx));
    const newY = Math.max(-160, Math.min(60, startOffsetRef.current.y + dy));
    setBowlOffset({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleQuickReveal = () => {
    sounds.playClick();
    setBowlOffset({ x: 0, y: -160 });
  };

  // Safe dice display
  const displayDice = dice && dice.length === 3 ? dice : ['bau', 'cua', 'tom'];

  return (
    <div 
      className="relative w-full flex flex-col items-center select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Plate & Table Background */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        
        {/* Đĩa Gốm Sứ Hoa Lam Việt Nam (Lacquered Porcelain Plate) */}
        <div className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-[#1b3a4b] border-8 border-[#3d5a80] shadow-[0_15px_30px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
          {/* Porcelain Ring & Folk Pattern */}
          <div className="w-56 h-56 sm:w-60 sm:h-60 rounded-full border-4 border-dashed border-[#90e0ef]/40 flex items-center justify-center bg-[#0d1b2a]">
            {/* Center Motif */}
            <div className="w-44 h-44 rounded-full border-2 border-[#00b4d8]/30 flex items-center justify-center bg-radial from-[#1e3d59] to-[#111827]">
              <span className="font-pixel text-[8px] text-sky-400/40 tracking-widest uppercase">
                BẦU CUA DÂN GIAN
              </span>
            </div>
          </div>
        </div>

        {/* 3 Viên Xúc Xắc Dân Gian */}
        <div className="absolute z-10 flex items-center justify-center gap-3">
          {displayDice.map((mascotId, idx) => {
            const item = mascotInfo[mascotId] || { name: mascotId, icon: '🎲' };
            const isShaking = phase === 'SHAKING';

            return (
              <div
                key={idx}
                className={`w-14 h-14 sm:w-16 sm:h-16 bg-[#fffdf0] border-4 border-[#2b1810] rounded-lg flex flex-col items-center justify-center shadow-2xl transform transition-transform ${
                  isShaking 
                    ? 'animate-bounce duration-75 scale-105 rotate-12' 
                    : phase === 'PAYOUT' 
                      ? 'animate-pulse scale-110 ring-2 ring-yellow-400' 
                      : ''
                }`}
                style={{
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 8px 16px rgba(0,0,0,0.6)',
                }}
              >
                <span className="text-2xl sm:text-3xl filter drop-shadow">
                  {item.icon}
                </span>
                <span className="font-pixel text-[7px] text-[#4a2810] font-bold uppercase mt-0.5">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bát Úp Gốm Men Ngọc & Tráng Men (Interactive Covered Lid) */}
        {phase !== 'PAYOUT' && (
          <div
            onPointerDown={handlePointerDown}
            className={`absolute z-20 w-60 h-60 sm:w-64 sm:h-64 rounded-full flex flex-col items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.9)] cursor-grab active:cursor-grabbing transition-transform ${
              phase === 'SHAKING' ? 'animate-[spin_0.3s_ease-in-out_infinite] scale-95' : ''
            }`}
            style={{
              transform: `translate(${bowlOffset.x}px, ${bowlOffset.y}px)`,
              background: 'radial-gradient(circle at 35% 35%, #84dcc6 0%, #468c81 50%, #1d433e 100%)',
              border: '6px solid #e0a96d',
              touchAction: 'none',
            }}
          >
            {/* Núm Bát / Tay Cầm */}
            <div className="w-16 h-16 rounded-full bg-[#e0a96d] border-4 border-[#8c5930] shadow-inner flex items-center justify-center">
              <span className="font-pixel text-[8px] text-[#3e2410] font-bold">
                {phase === 'SHAKING' ? 'ĐANG LẮC' : phase === 'PEEKING' ? 'NẶN BÁT' : 'CHỜ CƯỢC'}
              </span>
            </div>

            {/* Hướng dẫn nặn bát */}
            {phase === 'PEEKING' && (
              <div className="absolute bottom-6 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded border border-yellow-400/80 flex items-center gap-1.5 animate-pulse">
                <Hand className="w-3 h-3 text-yellow-300" />
                <span className="font-pixel text-[7.5px] text-yellow-200">
                  Vuốt để nặn bát
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Hint during PEEKING */}
      {phase === 'PEEKING' && (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={handleQuickReveal}
            className="pixel-btn bg-yellow-500 hover:bg-yellow-400 text-black font-pixel text-[9px] px-3 py-1.5 flex items-center gap-1 shadow-lg"
          >
            <Eye className="w-3 h-3" />
            <span>MỞ NGAY ({remainingSec}s)</span>
          </button>
        </div>
      )}
    </div>
  );
};
