import React from 'react';
import { AreaType } from '../types';
import { sounds } from '../utils/audio';
import { Sprout, Fish, Dices, Trees, Store } from 'lucide-react';

interface NavigationDockProps {
  currentArea: AreaType;
  onChangeArea: (area: AreaType) => void;
  onOpenShop: () => void;
}

export const NavigationDock: React.FC<NavigationDockProps> = ({
  currentArea,
  onChangeArea,
  onOpenShop,
}) => {
  const navItems = [
    {
      id: 'farm' as AreaType,
      label: 'Nong Trai',
      icon: Sprout,
      activeBg: 'bg-[#15803d]',
      tag: 'Trong trot',
    },
    {
      id: 'fishing' as AreaType,
      label: 'Ho Cau',
      icon: Fish,
      activeBg: 'bg-[#0369a1]',
      tag: 'Sinh thai',
    },
    {
      id: 'casino' as AreaType,
      label: 'Giai Tri',
      icon: Dices,
      activeBg: 'bg-[#6b21a8]',
      tag: 'Bau Cua',
    },
    {
      id: 'park' as AreaType,
      label: 'Cong Vien',
      icon: Trees,
      activeBg: 'bg-[#92400e]',
      tag: 'Giao luu',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#1c0d06] border-t-4 border-[#120703] px-2 py-2 shadow-[0_-6px_0_0_rgba(0,0,0,0.5)] select-none">
      <div className="max-w-4xl mx-auto flex items-center justify-between sm:justify-center sm:gap-3">
        {navItems.map((item) => {
          const isActive = currentArea === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                sounds.playClick();
                onChangeArea(item.id);
              }}
              className={`pixel-btn relative flex flex-col items-center justify-center px-2 py-1.5 sm:px-4 sm:py-2 ${
                isActive
                  ? `${item.activeBg} text-white -translate-y-1 shadow-[0_3px_0_0_#fde047]`
                  : 'bg-[#35190d] text-amber-200/80 hover:bg-[#452212]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    isActive ? 'text-yellow-300 animate-bounce' : 'text-amber-400'
                  }`}
                />
                <span className="font-pixel text-[9px] sm:text-[10px] tracking-tight">
                  {item.label}
                </span>
              </div>
              <span className="text-[8px] text-amber-300/80 font-mono hidden sm:block mt-0.5">
                {item.tag}
              </span>
            </button>
          );
        })}

        {/* Cửa Hàng (Shop) Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenShop();
          }}
          className="pixel-btn flex flex-col items-center justify-center px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-b from-yellow-500 to-amber-700 text-black font-black -translate-y-0.5 hover:-translate-y-1"
        >
          <div className="flex items-center gap-1.5">
            <Store className="w-4 h-4 sm:w-5 sm:h-5 text-black animate-pulse" />
            <span className="font-pixel text-[9px] sm:text-[10px] text-black">
              Cua Hang
            </span>
          </div>
          <span className="text-[8px] text-black/80 font-mono hidden sm:block mt-0.5">
            Mua Ban
          </span>
        </button>
      </div>
    </nav>
  );
};
