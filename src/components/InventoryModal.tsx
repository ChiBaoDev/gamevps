import React, { useState } from 'react';
import { UserProfile, InventoryItem } from '../types';
import { sounds } from '../utils/audio';
import { Backpack, Coins, Sparkles, Shirt, X } from 'lucide-react';

interface InventoryModalProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onClose: () => void;
  onShowMessage: (msg: string) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  user,
  onUpdateUser,
  onClose,
  onShowMessage,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'crop' | 'fish' | 'seed' | 'bait'>('all');
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);

  const filteredItems = user.inventory.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.type === selectedFilter;
  });

  // Handle Sell single or all
  const handleSellItem = (item: InventoryItem, all: boolean = false) => {
    const qty = all ? item.count : 1;
    const earnedXu = item.sellPrice * qty;

    sounds.playCoin();
    let updatedInv = user.inventory.map((i) => {
      if (i.id === item.id) {
        return { ...i, count: i.count - qty };
      }
      return i;
    }).filter((i) => i.count > 0);

    onUpdateUser({
      xu: user.xu + earnedXu,
      inventory: updatedInv,
      stats: {
        ...user.stats,
        moneyEarned: user.stats.moneyEarned + earnedXu,
      },
    });

    onShowMessage(`💰 Da ban ${qty} ${item.name} thu ve ${earnedXu} Xu!`);
    setActiveItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#24130a] pixel-box-gold w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#361a0b] p-3 border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl filter drop-shadow">🎒</span>
            <div>
              <h2 className="font-black text-yellow-300 text-xs sm:text-sm font-pixel pixel-shadow-sm">
                Ruong Do & Nong San Avatar
              </h2>
              <p className="font-vt323 text-base text-amber-200/80">
                Luu tru nong san vua gat, ca vua cau va dung cu lam nong
              </p>
            </div>
          </div>

          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="pixel-btn bg-red-800 hover:bg-red-700 text-white font-pixel text-xs px-2.5 py-1"
          >
            ✕
          </button>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-[#150a04] p-2 border-b-2 border-black overflow-x-auto">
          {[
            { id: 'all', label: 'Tat Ca' },
            { id: 'crop', label: '🌾 Nong San' },
            { id: 'fish', label: '🐟 Ca Tuoi' },
            { id: 'seed', label: '🌱 Hat Giong' },
            { id: 'bait', label: '🪱 Moi Cau' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { sounds.playClick(); setSelectedFilter(tab.id as typeof selectedFilter); }}
              className={`pixel-btn px-2.5 py-1 font-pixel text-[9px] whitespace-nowrap transition-all ${
                selectedFilter === tab.id
                  ? 'bg-amber-600 text-yellow-200'
                  : 'bg-[#221008] text-gray-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Inventory Grid */}
        <div className="p-4 overflow-y-auto flex-1 max-h-[55vh]">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-amber-300/60">
              <span className="text-4xl mb-2">📦</span>
              <p className="text-xs">Khong co vat pham nao trong ngan nay!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { sounds.playClick(); setActiveItem(item); }}
                  className="bg-[#381f12] hover:bg-[#462818] border-2 border-amber-800/80 hover:border-yellow-400 p-3 rounded-2xl cursor-pointer flex flex-col items-center justify-between transition-all group relative"
                >
                  <span className="absolute top-1.5 right-2 bg-black/60 text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-amber-900">
                    x{item.count}
                  </span>

                  <span className="text-4xl my-2 filter drop-shadow group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>

                  <div className="text-center w-full">
                    <span className="text-xs font-bold text-amber-200 truncate block">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-yellow-400 font-mono">
                      Ban: {item.sellPrice} Xu
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Item Detail Popover */}
        {activeItem && (
          <div className="bg-[#1e0f08] border-t-2 border-amber-800/80 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-bottom duration-150">
            <div className="flex items-center gap-3">
              <span className="text-4xl p-2 bg-black/40 rounded-2xl border border-amber-900">
                {activeItem.icon}
              </span>
              <div>
                <h4 className="font-black text-amber-200 text-sm">
                  {activeItem.name} <span className="text-yellow-400 font-mono">(x{activeItem.count})</span>
                </h4>
                <p className="text-[11px] text-amber-300/70">{activeItem.description}</p>
                <span className="text-[11px] text-yellow-400 font-bold">
                  Gia ban: {activeItem.sellPrice} Xu / cai
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSellItem(activeItem, false)}
                className="pixel-btn bg-amber-600 hover:bg-amber-500 text-yellow-100 font-black text-xs px-3 py-1.5 rounded-xl"
              >
                Ban 1 Cai
              </button>
              {activeItem.count > 1 && (
                <button
                  onClick={() => handleSellItem(activeItem, true)}
                  className="pixel-btn bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs px-3 py-1.5 rounded-xl"
                >
                  Ban Tat Ca ({activeItem.count * activeItem.sellPrice} Xu)
                </button>
              )}
              <button
                onClick={() => setActiveItem(null)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1"
              >
                Dong
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
