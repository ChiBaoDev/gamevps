import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ALL_HOUSES } from '../utils/gameData';
import { sounds } from '../utils/audio';

import { Home, Bed, Sparkles, Check, Lock, X, Zap } from 'lucide-react';

interface HouseModalProps {
  user: UserProfile;
  token: string;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onClose: () => void;
  onShowMessage: (msg: string) => void;
}

export const HouseModal: React.FC<HouseModalProps> = ({
  user,
  token,
  onUpdateUser,
  onClose,
  onShowMessage,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const ownedHouses = user.houses || ['house_leaf'];
  const currentHouseId = user.equippedHouseId || 'house_leaf';

  const handleBuyHouse = async (houseId: string) => {
    sounds.playClick();
    setLoading(true);
    try {
      const res = await fetch('/api/game/buy-house', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ houseId })
      });
      const data = await res.json();
      if (data.success && data.user) {
        sounds.playWin();
        onUpdateUser(data.user);
        onShowMessage(data.message);
      } else {
        onShowMessage(data.error || 'Lỗi mua nhà.');
      }
    } catch {
      onShowMessage('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleSleep = () => {
    sounds.playWin();
    const currentHouse = ALL_HOUSES.find(h => h.id === currentHouseId) || ALL_HOUSES[0];
    const restored = user.maxEnergy;
    onUpdateUser({ energy: restored });
    onShowMessage(`💤 Bạn vừa đánh một giấc thật ngon! Thể Lực đã được hồi đầy (${restored}/${restored} Energy).`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#1e100a] border-4 border-amber-600 rounded-2xl shadow-[0_0_50px_rgba(217,119,6,0.3)] flex flex-col max-h-[90vh] overflow-hidden text-amber-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950 via-[#2a170e] to-amber-950 border-b-2 border-amber-600/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-300 font-pixel flex items-center gap-2">
                BẤT ĐỘNG SẢN & NHÀ Ở ĐẠI GIA
              </h2>
              <p className="text-xs text-amber-300/80">Sở hữu nhà giúp tăng Max Thể Lực & ngủ hồi phục năng lượng siêu tốc</p>
            </div>
          </div>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-xl transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current House Banner & Sleep Button */}
        <div className="p-4 bg-gradient-to-r from-amber-900/40 via-yellow-950/30 to-amber-900/40 border-b border-amber-800/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛏️</span>
            <div>
              <p className="text-xs text-amber-300 font-bold">Ngôi nhà đang ở: <span className="text-yellow-400 font-black">{ALL_HOUSES.find(h => h.id === currentHouseId)?.name}</span></p>
              <p className="text-[11px] text-zinc-300 flex items-center gap-1 mt-0.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                Thể lực tối đa: <span className="text-cyan-300 font-bold">{user.maxEnergy} Energy</span> (Hiện tại: {user.energy}/{user.maxEnergy})
              </p>
            </div>
          </div>
          <button
            onClick={handleSleep}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition border border-cyan-400"
          >
            <Bed className="w-4 h-4" /> Đi Ngủ (Hồi Đầy 100% Thể Lực)
          </button>
        </div>

        {/* List of Houses */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {ALL_HOUSES.map((house) => {
            const isOwned = ownedHouses.includes(house.id);
            const isEquipped = currentHouseId === house.id;

            return (
              <div
                key={house.id}
                className={`p-4 rounded-xl border-2 transition flex flex-col justify-between ${
                  isEquipped
                    ? 'bg-amber-950/70 border-yellow-400 shadow-lg'
                    : isOwned
                    ? 'bg-[#29170e] border-amber-700/60'
                    : 'bg-[#1a0e08] border-zinc-800 opacity-95 hover:border-amber-700/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{house.icon}</span>
                      <div>
                        <h4 className="font-bold text-amber-200 text-sm font-pixel">{house.name}</h4>
                        <p className="text-[11px] text-cyan-300 font-semibold flex items-center gap-1 mt-0.5">
                          <Zap className="w-3 h-3 fill-cyan-400" /> Max Energy: {house.maxEnergy}
                        </p>
                      </div>
                    </div>
                    {isEquipped && (
                      <span className="px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-black rounded-full shadow">
                        ĐANG Ở
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300 mt-3 leading-relaxed">{house.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between">
                  <div className="text-xs">
                    {house.priceXu === 0 && house.priceLuong === 0 ? (
                      <span className="text-emerald-400 font-bold">Miễn Phí</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {house.priceXu > 0 && <span className="text-yellow-400 font-bold">{house.priceXu.toLocaleString()} Xu</span>}
                        {house.priceLuong > 0 && <span className="text-purple-400 font-bold">+{house.priceLuong} Lượng</span>}
                      </div>
                    )}
                  </div>

                  {isOwned ? (
                    <button
                      disabled={isEquipped}
                      onClick={() => onUpdateUser({ equippedHouseId: house.id, maxEnergy: house.maxEnergy })}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition"
                    >
                      {isEquipped ? 'Đang Sử Dụng' : 'Chuyển Đến Ở'}
                    </button>
                  ) : (
                    <button
                      disabled={loading || user.xu < house.priceXu || user.luong < house.priceLuong}
                      onClick={() => handleBuyHouse(house.id)}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black rounded-lg text-xs transition shadow"
                    >
                      Mua Ngay
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
