import React, { useState } from 'react';
import { UserProfile, CropDefinition, FishingRod, BaitDefinition } from '../types';
import { CROPS, FISHING_RODS, BAITS, FASHION_SHOP_ITEMS } from '../utils/gameData';
import { sounds } from '../utils/audio';
import { 
  Store, 
  Sprout, 
  Fish, 
  Sparkles, 
  Shirt, 
  Coins, 
  Gem, 
  Check, 
  ShoppingBag,
  TrendingDown
} from 'lucide-react';

interface ShopModalProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onClose: () => void;
  onShowMessage: (msg: string) => void;
}

type ShopTab = 'seeds' | 'fishing' | 'fashion' | 'sell';

export const ShopModal: React.FC<ShopModalProps> = ({
  user,
  onUpdateUser,
  onClose,
  onShowMessage,
}) => {
  const [activeTab, setActiveTab] = useState<ShopTab>('seeds');

  // Handle Buy Seed
  const handleBuySeed = (crop: CropDefinition, quantity: number = 1) => {
    const cost = crop.seedPrice * quantity;
    if (user.xu < cost) {
      sounds.playClick();
      onShowMessage(`Ban khong du Xu de mua ${quantity} ${crop.seedName}!`);
      return;
    }

    sounds.playCoin();
    const updatedInv = [...user.inventory];
    const existIdx = updatedInv.findIndex((i) => i.id === `${crop.id}_seed`);
    if (existIdx >= 0) {
      updatedInv[existIdx].count += quantity;
    } else {
      updatedInv.push({
        id: `${crop.id}_seed`,
        name: crop.seedName,
        type: 'seed',
        count: quantity,
        sellPrice: Math.round(crop.seedPrice * 0.5),
        icon: crop.seedIcon || '🌱',
        description: `Hat giong gieo de trong ${crop.name}.`,
      });
    }

    onUpdateUser({
      xu: user.xu - cost,
      inventory: updatedInv,
    });
    onShowMessage(`Da mua ${quantity} ${crop.seedName} voi gia ${cost} Xu!`);
  };

  // Handle Buy Fertilizer
  const handleBuyFertilizer = () => {
    const cost = 80;
    if (user.xu < cost) {
      onShowMessage('Ban khong du 80 Xu!');
      return;
    }
    sounds.playCoin();
    const updatedInv = [...user.inventory];
    const existIdx = updatedInv.findIndex((i) => i.id === 'fertilizer');
    if (existIdx >= 0) {
      updatedInv[existIdx].count += 1;
    } else {
      updatedInv.push({
        id: 'fertilizer',
        name: 'Phan Bon Nhanh',
        type: 'fertilizer',
        count: 1,
        sellPrice: 30,
        icon: '🧪',
        description: 'Giam 50% thoi gian lon cua cay trong.',
      });
    }

    onUpdateUser({
      xu: user.xu - cost,
      inventory: updatedInv,
    });
    onShowMessage('Da mua 1 Phan Bon Nhanh!');
  };

  // Handle Buy Fishing Rod
  const handleBuyRod = (rod: FishingRod) => {
    if (user.equippedRodId === rod.id) {
      onShowMessage('Ban dang su dung can cau nay roi!');
      return;
    }

    if (rod.priceLuong > 0 && user.luong < rod.priceLuong) {
      onShowMessage(`Ban can co it nhat ${rod.priceLuong} Luong!`);
      return;
    }
    if (rod.priceXu > 0 && user.xu < rod.priceXu) {
      onShowMessage(`Ban khong du ${rod.priceXu} Xu!`);
      return;
    }

    sounds.playCoin();
    onUpdateUser({
      xu: user.xu - rod.priceXu,
      luong: user.luong - rod.priceLuong,
      equippedRodId: rod.id,
      appearance: {
        ...user.appearance,
        handheld: rod.id,
      },
    });
    onShowMessage(`🎣 Chuc mung ban da so huu ${rod.name}! Ti le may man cau ca tang vot.`);
  };

  // Handle Buy Bait
  const handleBuyBait = (bait: BaitDefinition) => {
    if (user.xu < bait.priceXu) {
      onShowMessage(`Ban khong du ${bait.priceXu} Xu de mua ${bait.name}!`);
      return;
    }

    sounds.playCoin();
    const updatedInv = [...user.inventory];
    const existIdx = updatedInv.findIndex((i) => i.id === bait.id);
    if (existIdx >= 0) {
      updatedInv[existIdx].count += bait.count;
    } else {
      updatedInv.push({
        id: bait.id,
        name: bait.name,
        type: 'bait',
        count: bait.count,
        sellPrice: Math.round(bait.priceXu / bait.count / 2),
        icon: bait.icon,
        description: bait.description,
      });
    }

    onUpdateUser({
      xu: user.xu - bait.priceXu,
      inventory: updatedInv,
    });
    onShowMessage(`Da mua ${bait.count} ${bait.name}!`);
  };

  // Handle Buy Fashion
  const handleBuyFashion = (item: typeof FASHION_SHOP_ITEMS[0]) => {
    if (item.priceLuong > 0 && user.luong < item.priceLuong) {
      onShowMessage(`Ban can ${item.priceLuong} Luong de so huu trang phuc VIP nay!`);
      return;
    }
    if (item.priceXu > 0 && user.xu < item.priceXu) {
      onShowMessage(`Ban khong du ${item.priceXu} Xu!`);
      return;
    }

    sounds.playWin();
    const newAppearance = { ...user.appearance };
    if (item.type === 'hat') newAppearance.hat = item.value;
    else if (item.type === 'wings') newAppearance.wings = item.value;
    else if (item.type === 'glasses') newAppearance.glasses = item.value;

    onUpdateUser({
      xu: user.xu - item.priceXu,
      luong: user.luong - item.priceLuong,
      appearance: newAppearance,
    });
    onShowMessage(`✨ Ban vua mac ${item.name}! Ngoai hinh Avatar trong cuc chat.`);
  };

  // Quick Sell All Crops and Fish
  const handleSellAllHarvest = () => {
    let totalXu = 0;
    const remainingInv = user.inventory.filter((item) => {
      if (item.type === 'crop' || item.type === 'fish' || item.type === 'egg') {
        totalXu += item.sellPrice * item.count;
        return false;
      }
      return true;
    });

    if (totalXu === 0) {
      onShowMessage('Ban khong co nong san hoac ca nao trong ruong de ban!');
      return;
    }

    sounds.playCoin();
    onUpdateUser({
      xu: user.xu + totalXu,
      inventory: remainingInv,
      stats: {
        ...user.stats,
        moneyEarned: user.stats.moneyEarned + totalXu,
      },
    });
    onShowMessage(`💰 Da ban toan bo nong san & ca trong ruong! Thu ve ${totalXu.toLocaleString('vi-VN')} Xu.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#24130a] pixel-box-gold w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#361a0b] p-3 border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl filter drop-shadow">🏪</span>
            <div>
              <h2 className="font-black text-yellow-300 text-xs sm:text-sm font-pixel pixel-shadow-sm">
                Cua Hang Thuong Nghiep Avatar
              </h2>
              <p className="font-vt323 text-base text-amber-200/80">
                Cung cap hat giong, can cau, moi ngon va thoi trang dao pho
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

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-black bg-[#150a04] px-2 pt-2 gap-1 overflow-x-auto">
          {[
            { id: 'seeds' as ShopTab, label: 'Hat Giong', icon: Sprout },
            { id: 'fishing' as ShopTab, label: 'Can & Moi', icon: Fish },
            { id: 'fashion' as ShopTab, label: 'Thoi Trang', icon: Shirt },
            { id: 'sell' as ShopTab, label: 'Ban Hang', icon: TrendingDown },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { sounds.playClick(); setActiveTab(tab.id); }}
                className={`pixel-btn flex items-center gap-1.5 px-2.5 py-1.5 font-pixel text-[9px] whitespace-nowrap ${
                  isActive
                    ? 'bg-[#3b1c0b] text-yellow-300 border-b-0'
                    : 'bg-[#1e0e06] text-amber-400 hover:text-white'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto flex-1 max-h-[60vh]">
          {/* TAB 1: SEEDS & FERTILIZER */}
          {activeTab === 'seeds' && (
            <div className="space-y-4">
              {/* Fertilizer item card */}
              <div className="bg-[#381f12] border-2 border-amber-800/80 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 bg-black/30 rounded-xl">🧪</span>
                  <div>
                    <h4 className="font-black text-amber-200 text-sm">Phan Bon Nhanh</h4>
                    <p className="text-xs text-amber-300/70">
                      Rut ngan 50% thoi gian lon cua cay trong bat ky
                    </p>
                    <span className="text-xs font-black text-yellow-400 font-mono">
                      80 Xu / goi
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleBuyFertilizer}
                  className="pixel-btn bg-amber-600 hover:bg-amber-500 text-yellow-100 font-black text-xs px-3 py-2 rounded-xl"
                >
                  Mua 1 Goi
                </button>
              </div>

              {/* Seed Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CROPS.map((crop) => (
                  <div
                    key={crop.id}
                    className="bg-[#381f12] border-2 border-amber-800/60 p-3 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl">{crop.icon}</span>
                      <div>
                        <h4 className="font-bold text-amber-200 text-xs sm:text-sm">
                          {crop.seedName}
                        </h4>
                        <div className="text-[10px] text-amber-300/80 font-mono">
                          Lon trong: {crop.growDuration}s | Ban: {crop.sellPrice} Xu
                        </div>
                        <span className="text-xs font-extrabold text-yellow-400 font-mono">
                          {crop.seedPrice} Xu / hat
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleBuySeed(crop, 1)}
                        className="pixel-btn bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg"
                      >
                        Mua 1
                      </button>
                      <button
                        onClick={() => handleBuySeed(crop, 5)}
                        className="pixel-btn bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg"
                      >
                        Mua 5 ({crop.seedPrice * 5} Xu)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: FISHING RODS & BAITS */}
          {activeTab === 'fishing' && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide">
                1. Moi Cau Ca:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BAITS.map((bait) => (
                  <div
                    key={bait.id}
                    className="bg-[#381f12] border-2 border-amber-800/80 p-3 rounded-2xl flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{bait.icon}</span>
                      <div>
                        <h5 className="font-bold text-amber-200 text-xs">{bait.name}</h5>
                        <span className="text-[10px] text-amber-300/70 block">
                          Goi {bait.count} con moi
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-300 mb-2">{bait.description}</p>
                    <button
                      onClick={() => handleBuyBait(bait)}
                      className="pixel-btn bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs py-1.5 rounded-xl w-full"
                    >
                      Mua ({bait.priceXu} Xu)
                    </button>
                  </div>
                ))}
              </div>

              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide pt-2">
                2. Can Cau Chuyen Dung:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FISHING_RODS.map((rod) => {
                  const isEquipped = user.equippedRodId === rod.id;
                  return (
                    <div
                      key={rod.id}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-between ${
                        isEquipped
                          ? 'bg-[#472a1a] border-yellow-400'
                          : 'bg-[#381f12] border-amber-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl">{rod.icon}</span>
                        <div>
                          <h5 className="font-bold text-amber-200 text-xs sm:text-sm">
                            {rod.name}
                          </h5>
                          <div className="text-[10px] text-emerald-400 font-bold">
                            May man: +{rod.luckBonus}%
                          </div>
                          <div className="text-xs font-extrabold text-yellow-400 font-mono">
                            {rod.priceLuong > 0
                              ? `${rod.priceLuong} Luong + ${rod.priceXu} Xu`
                              : rod.priceXu > 0
                              ? `${rod.priceXu} Xu`
                              : 'Mac dinh'}
                          </div>
                        </div>
                      </div>

                      {isEquipped ? (
                        <span className="text-xs font-black text-yellow-400 bg-black/40 px-2.5 py-1 rounded-xl border border-yellow-500 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Dang dung
                        </span>
                      ) : (
                        <button
                          onClick={() => handleBuyRod(rod)}
                          className="pixel-btn bg-amber-600 hover:bg-amber-500 text-yellow-100 font-bold text-xs px-3 py-1.5 rounded-xl"
                        >
                          Trang Bi
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: FASHION VIP */}
          {activeTab === 'fashion' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FASHION_SHOP_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#381f12] border-2 border-amber-800/60 p-3 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-1.5 bg-black/30 rounded-xl">{item.icon}</span>
                    <div>
                      <h5 className="font-bold text-amber-200 text-xs sm:text-sm">{item.name}</h5>
                      <p className="text-[10px] text-amber-300/70">{item.description}</p>
                      <div className="text-xs font-black mt-1 font-mono">
                        {item.priceLuong > 0 ? (
                          <span className="text-fuchsia-400">{item.priceLuong} Luong</span>
                        ) : (
                          <span className="text-yellow-400">{item.priceXu} Xu</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyFashion(item)}
                    className="pixel-btn bg-gradient-to-r from-fuchsia-700 to-purple-700 hover:from-fuchsia-600 hover:to-purple-600 text-white font-bold text-xs px-3 py-2 rounded-xl"
                  >
                    Mua & Mac
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: SELL CROPS & FISH */}
          {activeTab === 'sell' && (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="text-5xl mb-3">💰</div>
              <h3 className="font-black text-amber-200 text-base sm:text-lg mb-2">
                Thu Mua Toan Bo Nong San & Ca Trong Ruong
              </h3>
              <p className="text-xs text-amber-300/80 max-w-md mb-4">
                Bac Ba Nong Dan va Lai buon ho cau se quy doi toan bo rau cu, dua hau, ca cau duoc thanh Xu vang day tui!
              </p>

              <button
                onClick={handleSellAllHarvest}
                className="pixel-btn bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm px-8 py-3 rounded-2xl shadow-xl flex items-center gap-2"
              >
                <Coins className="w-5 h-5" />
                <span>BAN TOAN BO NONG SAN & CA</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
