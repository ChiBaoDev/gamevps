import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ALL_VEHICLES } from '../utils/gameData';
import { sounds } from '../utils/audio';

import { Car, Zap, Check, X, Sparkles } from 'lucide-react';

interface VehicleShopModalProps {
  user: UserProfile;
  token: string;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onClose: () => void;
  onShowMessage: (msg: string) => void;
}

export const VehicleShopModal: React.FC<VehicleShopModalProps> = ({
  user,
  token,
  onUpdateUser,
  onClose,
  onShowMessage,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const ownedVehicles = user.vehicles || [];
  const currentVehicleId = user.equippedVehicleId || '';

  const handleBuyVehicle = async (vehicleId: string) => {
    sounds.playClick();
    setLoading(true);
    try {
      const res = await fetch('/api/game/buy-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ vehicleId })
      });
      const data = await res.json();
      if (data.success && data.user) {
        sounds.playWin();
        onUpdateUser(data.user);
        onShowMessage(data.message);
      } else {
        onShowMessage(data.error || 'Lỗi mua xe.');
      }
    } catch {
      onShowMessage('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleEquip = (vehicleId: string) => {
    sounds.playClick();
    const nextVeh = currentVehicleId === vehicleId ? '' : vehicleId;
    onUpdateUser({ equippedVehicleId: nextVeh });
    onShowMessage(nextVeh ? 'Đã trang bị phương tiện lái dạo phố!' : 'Đã cất phương tiện vào gara.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#1a120c] border-4 border-yellow-500 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.3)] flex flex-col max-h-[90vh] overflow-hidden text-amber-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 border-b-2 border-yellow-500/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-400/50 flex items-center justify-center text-yellow-400">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-yellow-300 font-pixel flex items-center gap-2">
                SHOWROOM XE CỘ & THÚ CƯỠI SANG CHẢNH
              </h2>
              <p className="text-xs text-zinc-300">Tăng tốc độ di chuyển trong công viên & vệt sáng pixel độc quyền</p>
            </div>
          </div>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-xl transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Vehicles Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_VEHICLES.map((veh) => {
            const isOwned = ownedVehicles.includes(veh.id);
            const isEquipped = currentVehicleId === veh.id;

            return (
              <div
                key={veh.id}
                className={`p-4 rounded-xl border-2 transition flex flex-col justify-between ${
                  isEquipped
                    ? 'bg-yellow-950/60 border-yellow-400 shadow-lg'
                    : isOwned
                    ? 'bg-[#281c13] border-amber-800/60'
                    : 'bg-[#1e140d] border-zinc-800 opacity-95 hover:border-yellow-700/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-5xl">{veh.icon}</span>
                    {isEquipped && (
                      <span className="px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-black rounded-full shadow">
                        ĐANG LÁI
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-amber-200 text-sm font-pixel mt-3">{veh.name}</h4>
                  <p className="text-xs text-yellow-300 font-bold flex items-center gap-1 mt-1">
                    <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    Tốc độ chạy: +{veh.speedBonus}%
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">{veh.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-yellow-400 font-bold">{veh.priceXu.toLocaleString()} Xu</span>
                    {veh.priceLuong > 0 && <span className="text-purple-400 font-bold ml-1.5">+{veh.priceLuong} Lượng</span>}
                  </div>

                  {isOwned ? (
                    <button
                      onClick={() => handleEquip(veh.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        isEquipped ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {isEquipped ? 'Cất Xe' : 'Lái Xe'}
                    </button>
                  ) : (
                    <button
                      disabled={loading || user.xu < veh.priceXu || user.luong < veh.priceLuong}
                      onClick={() => handleBuyVehicle(veh.id)}
                      className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-black rounded-lg text-xs transition shadow"
                    >
                      Mua Xe
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
