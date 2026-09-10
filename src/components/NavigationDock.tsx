import React from 'react';
import { AreaType } from '../types';
import { sounds } from '../utils/audio';
import { Sprout, Fish, Dices, Trees, Store, Home, Car, ShoppingBag } from 'lucide-react';

interface NavigationDockProps {
  currentArea: AreaType;
  onChangeArea: (area: AreaType) => void;
  onOpenShop: () => void;
  onOpenHouse?: () => void;
  onOpenVehicle?: () => void;
  onOpenMarket?: () => void;
}

export const NavigationDock: React.FC<NavigationDockProps> = ({
  currentArea,
  onChangeArea,
  onOpenShop,
  onOpenHouse,
  onOpenVehicle,
  onOpenMarket,
}) => {
  const navItems = [
    {
      id: 'farm' as AreaType,
      label: 'Nông Trại',
      icon: Sprout,
      activeBg: 'bg-[#15803d]',
      tag: 'Trồng trọt',
    },
    {
      id: 'fishing' as AreaType,
      label: 'Hồ Câu',
      icon: Fish,
      activeBg: 'bg-[#0369a1]',
      tag: 'Sinh thái',
    },
    {
      id: 'casino' as AreaType,
      label: 'Bầu Cua',
      icon: Dices,
      activeBg: 'bg-[#6b21a8]',
      tag: 'Sới bạc',
    },
    {
      id: 'park' as AreaType,
      label: 'Công Viên',
      icon: Trees,
      activeBg: 'bg-[#92400e]',
      tag: 'Giao lưu',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#1c0d06] border-t-4 border-[#120703] px-2 py-1.5 shadow-[0_-6px_0_0_rgba(0,0,0,0.5)] select-none">
      <div className="max-w-5xl mx-auto flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2">
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
              className={`pixel-btn relative flex flex-col items-center justify-center px-2 py-1 sm:px-3 sm:py-1.5 ${
                isActive
                  ? `${item.activeBg} text-white -translate-y-1 shadow-[0_3px_0_0_#fde047]`
                  : 'bg-[#35190d] text-amber-200/80 hover:bg-[#452212]'
              }`}
            >
              <div className="flex items-center gap-1">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-yellow-300 animate-bounce' : 'text-amber-400'
                  }`}
                />
                <span className="font-pixel text-[9px] sm:text-[10px]">
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}

        {/* Chợ Đêm (Marketplace) Button */}
        {onOpenMarket && (
          <button
            onClick={() => { sounds.playClick(); onOpenMarket(); }}
            className="pixel-btn bg-amber-800 hover:bg-amber-700 text-amber-100 px-2 py-1 sm:px-3 sm:py-1.5 flex items-center gap-1 font-pixel text-[9px]"
            title="Sàn Giao Dịch & Chợ Đêm"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden sm:inline">Chợ Đêm</span>
          </button>
        )}

        {/* Nhà Ở (House) Button */}
        {onOpenHouse && (
          <button
            onClick={() => { sounds.playClick(); onOpenHouse(); }}
            className="pixel-btn bg-indigo-900 hover:bg-indigo-800 text-indigo-100 px-2 py-1 sm:px-3 sm:py-1.5 flex items-center gap-1 font-pixel text-[9px]"
            title="Nhà Ở & Biệt Thự Đại Gia"
          >
            <Home className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Nhà Ở</span>
          </button>
        )}

        {/* Xe Cộ (Vehicle) Button */}
        {onOpenVehicle && (
          <button
            onClick={() => { sounds.playClick(); onOpenVehicle(); }}
            className="pixel-btn bg-fuchsia-900 hover:bg-fuchsia-800 text-fuchsia-100 px-2 py-1 sm:px-3 sm:py-1.5 flex items-center gap-1 font-pixel text-[9px]"
            title="Showroom Xe Cộ & Thú Cưỡi"
          >
            <Car className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden sm:inline">Xe Cộ</span>
          </button>
        )}

        {/* Cửa Hàng (Shop) Button */}
        <button
          onClick={() => { sounds.playClick(); onOpenShop(); }}
          className="pixel-btn flex items-center justify-center px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-b from-yellow-500 to-amber-600 text-black font-black hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-1">
            <Store className="w-4 h-4 text-black animate-pulse" />
            <span className="font-pixel text-[9px] sm:text-[10px] text-black">
              Shop
            </span>
          </div>
        </button>
      </div>
    </nav>
  );
};
