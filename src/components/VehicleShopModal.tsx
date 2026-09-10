import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ALL_VEHICLES } from '../utils/gameData';
import { sounds } from '../utils/audio';

import { 
  Car, 
  Zap, 
  Check, 
  X, 
  Sparkles, 
  Coins, 
  Gem, 
  ShoppingBag, 
  Warehouse, 
  DollarSign, 
  AlertTriangle 
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'shop' | 'garage'>('shop');
  const [loading, setLoading] = useState<boolean>(false);
  const [sellingVehicleId, setSellingVehicleId] = useState<string | null>(null);

  const ownedVehicles = user.vehicles || [];
  const currentVehicleId = user.equippedVehicleId || '';

  // 1. Mua xe mới
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

  // 2. Trang bị / Cất xe (Đồng bộ trực tiếp lên Server)
  const handleEquipVehicle = async (vehicleId: string) => {
    sounds.playClick();
    const nextVeh = currentVehicleId === vehicleId ? '' : vehicleId;
    setLoading(true);
    try {
      const res = await fetch('/api/game/equip-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ vehicleId: nextVeh })
      });
      const data = await res.json();
      if (data.success && data.user) {
        onUpdateUser(data.user);
        onShowMessage(data.message);
      } else {
        onShowMessage(data.error || 'Lỗi trang bị xe.');
      }
    } catch {
      // Fallback local
      onUpdateUser({ equippedVehicleId: nextVeh });
      onShowMessage(nextVeh ? 'Đã trang bị phương tiện!' : 'Đã cất phương tiện vào gara.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Bán lại xe cho Showroom (Nhận 70% Xu hoàn trả)
  const handleSellVehicle = async (vehicleId: string) => {
    sounds.playClick();
    setLoading(true);
    try {
      const res = await fetch('/api/game/sell-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ vehicleId })
      });
      const data = await res.json();
      if (data.success && data.user) {
        sounds.playCoin();
        onUpdateUser(data.user);
        onShowMessage(data.message);
        setSellingVehicleId(null);
      } else {
        onShowMessage(data.error || 'Lỗi bán xe.');
      }
    } catch {
      onShowMessage('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const myOwnedList = ALL_VEHICLES.filter((v) => ownedVehicles.includes(v.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#1a120c] border-4 border-yellow-500 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.3)] flex flex-col max-h-[90vh] overflow-hidden text-amber-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 border-b-2 border-yellow-500/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-400/50 flex items-center justify-center text-yellow-400">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-yellow-300 font-pixel flex items-center gap-2">
                SHOWROOM & GARA XE CỘ AVATAR
              </h2>
              <p className="text-xs text-zinc-300 hidden sm:block">
                Mua bán xe, lái dạo phố tăng tốc độ di chuyển & hiệu ứng khói/neon trong công viên
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Balances */}
            <div className="hidden sm:flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-xl border border-yellow-600/40 font-pixel text-[9px]">
              <span className="text-yellow-400">💰 {user.xu.toLocaleString()} Xu</span>
              <span className="text-pink-400">💎 {user.luong} Lượng</span>
            </div>

            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-xl transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-yellow-900/60 bg-[#120a05] px-4 sm:px-6 gap-2">
          <button
            onClick={() => { sounds.playClick(); setActiveTab('shop'); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold font-pixel border-b-2 transition ${
              activeTab === 'shop'
                ? 'border-yellow-400 text-yellow-300 bg-yellow-500/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> 🛒 Cửa Hàng Showroom
          </button>

          <button
            onClick={() => { sounds.playClick(); setActiveTab('garage'); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold font-pixel border-b-2 transition ${
              activeTab === 'garage'
                ? 'border-yellow-400 text-yellow-300 bg-yellow-500/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Warehouse className="w-4 h-4" /> 🏎️ Gara Của Tôi ({ownedVehicles.length})
          </button>
        </div>

        {/* Tab 1: SHOWROOM (MUA MỚI) */}
        {activeTab === 'shop' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_VEHICLES.map((veh) => {
              const isOwned = ownedVehicles.includes(veh.id);
              const isEquipped = currentVehicleId === veh.id;
              const canAfford = user.xu >= veh.priceXu && user.luong >= veh.priceLuong;

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
                      <span className="text-5xl filter drop-shadow">{veh.icon}</span>
                      {isEquipped ? (
                        <span className="px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-black font-pixel rounded-full shadow">
                          ĐANG LÁI
                        </span>
                      ) : isOwned ? (
                        <span className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-black font-pixel rounded-full">
                          ĐÃ SỞ HỮU
                        </span>
                      ) : null}
                    </div>

                    <h4 className="font-bold text-amber-200 text-sm font-pixel mt-3">{veh.name}</h4>
                    <p className="text-xs text-yellow-300 font-bold flex items-center gap-1 mt-1">
                      <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      Tốc độ di chuyển: +{veh.speedBonus}%
                    </p>
                    <p className="text-xs text-zinc-400 mt-2 font-sans">{veh.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <div className="text-xs font-mono">
                      <span className="text-yellow-400 font-bold">{veh.priceXu.toLocaleString()} Xu</span>
                      {veh.priceLuong > 0 && (
                        <span className="text-pink-400 font-bold ml-1.5">+{veh.priceLuong} Lượng</span>
                      )}
                    </div>

                    {isOwned ? (
                      <button
                        onClick={() => handleEquipVehicle(veh.id)}
                        disabled={loading}
                        className={`px-3 py-1.5 rounded-lg text-xs font-pixel font-bold transition shadow ${
                          isEquipped
                            ? 'bg-red-800 hover:bg-red-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {isEquipped ? 'Cất Xe' : 'Lái Xe'}
                      </button>
                    ) : (
                      <button
                        disabled={loading || !canAfford}
                        onClick={() => handleBuyVehicle(veh.id)}
                        className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-black font-pixel rounded-lg text-xs transition shadow"
                      >
                        {loading ? '...' : 'Mua Xe'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: GARAGE (QUẢN LÝ & BÁN LẠI XE) */}
        {activeTab === 'garage' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {myOwnedList.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 space-y-3">
                <Warehouse className="w-12 h-12 mx-auto text-zinc-600" />
                <p className="font-pixel text-sm text-yellow-300">Gara của bạn hiện chưa có chiếc xe nào</p>
                <p className="text-xs text-zinc-400">
                  Hãy ghé tab <b>Cửa Hàng Showroom</b> để mua chiếc xe đầu tiên lái dạo phố nhé!
                </p>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="mt-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-pixel text-xs rounded-xl font-bold shadow"
                >
                  Đến Showroom Mua Xe
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-300 bg-[#130904] p-3 rounded-xl border border-yellow-900/40">
                  <span>🚗 Danh sách các phương tiện trong Gara của bạn:</span>
                  <span className="text-yellow-400 font-pixel text-[9.5px]">
                    Bán lại xe nhận hoàn tiền 70% giá trị
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myOwnedList.map((veh) => {
                    const isEquipped = currentVehicleId === veh.id;
                    const refundAmount = Math.max(500, Math.floor((veh.priceXu || 0) * 0.70) + ((veh.priceLuong || 0) * 1000));

                    return (
                      <div
                        key={veh.id}
                        className={`p-4 rounded-xl border-2 transition flex flex-col justify-between ${
                          isEquipped
                            ? 'bg-yellow-950/60 border-yellow-400 shadow-lg'
                            : 'bg-[#22150d] border-amber-900/70 hover:border-amber-600'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-5xl filter drop-shadow">{veh.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-yellow-300 text-sm font-pixel">{veh.name}</h4>
                              {isEquipped && (
                                <span className="px-2 py-0.5 bg-yellow-500 text-black text-[9px] font-black font-pixel rounded-full shadow">
                                  ĐANG LÁI
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-yellow-400 font-bold flex items-center gap-1 mt-1">
                              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                              +{veh.speedBonus}% Tốc độ di chuyển
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">{veh.description}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                          <span className="text-xs text-emerald-400 font-mono">
                            Giá bán lại: <b>+{refundAmount.toLocaleString()} Xu</b>
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Nút Lái / Cất xe */}
                            <button
                              onClick={() => handleEquipVehicle(veh.id)}
                              disabled={loading}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-pixel font-bold transition shadow ${
                                isEquipped
                                  ? 'bg-amber-800 hover:bg-amber-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              {isEquipped ? 'Cất Xe' : 'Lái Xe'}
                            </button>

                            {/* Nút Bán lại */}
                            <button
                              onClick={() => setSellingVehicleId(veh.id)}
                              disabled={loading}
                              className="px-3 py-1.5 bg-red-900/80 hover:bg-red-700 text-red-100 font-pixel text-xs rounded-lg font-bold border border-red-700/60 transition shadow"
                            >
                              Bán Lại
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal: Bán lại xe */}
        {sellingVehicleId && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
            <div className="bg-[#241008] pixel-box-gold max-w-sm w-full p-5 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto" />
              <h3 className="font-pixel text-sm text-yellow-300">XÁC NHẬN BÁN LẠI XE?</h3>
              
              {(() => {
                const targetVeh = ALL_VEHICLES.find(v => v.id === sellingVehicleId);
                const refund = Math.max(500, Math.floor(((targetVeh?.priceXu || 0) * 0.70) + ((targetVeh?.priceLuong || 0) * 1000)));
                return (
                  <div>
                    <span className="text-4xl block my-2">{targetVeh?.icon}</span>
                    <p className="text-xs text-amber-200">
                      Bạn có chắc muốn bán lại chiếc <b className="text-yellow-300">{targetVeh?.name}</b> cho Showroom không?
                    </p>
                    <p className="font-pixel text-xs text-emerald-400 mt-2">
                      💰 Nhận lại ngay: +{refund.toLocaleString()} Xu
                    </p>
                  </div>
                );
              })()}

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  disabled={loading}
                  onClick={() => handleSellVehicle(sellingVehicleId)}
                  className="pixel-btn bg-emerald-600 hover:bg-emerald-500 text-white font-pixel text-xs py-1.5 px-4 shadow"
                >
                  {loading ? 'Đang bán...' : 'Đồng Ý Bán'}
                </button>
                <button
                  onClick={() => setSellingVehicleId(null)}
                  className="pixel-btn bg-gray-800 hover:bg-gray-700 text-white font-pixel text-xs py-1.5 px-4 shadow"
                >
                  Hủy Bỏ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

