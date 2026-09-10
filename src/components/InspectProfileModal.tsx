import React, { useState, useEffect } from 'react';
import { UserProfile, InventoryItem } from '../types';
import { CharacterSprite } from './CharacterSprite';
import { sounds } from '../utils/audio';
import { ALL_HOUSES, ALL_VEHICLES } from '../utils/gameData';
import { 
  Package, 
  Car, 
  Heart, 
  Sparkles, 
  Coins, 
  Gem, 
  ShieldCheck,
  Building,
  Activity,
  Trophy
} from 'lucide-react';

interface InspectProfileModalProps {
  targetIdOrName?: string | null;
  initialProfile?: Partial<UserProfile> | null;
  onClose: () => void;
  onShowMessage: (msg: string) => void;
}

export const InspectProfileModal: React.FC<InspectProfileModalProps> = ({
  targetIdOrName,
  initialProfile,
  onClose,
  onShowMessage,
}) => {
  const [profile, setProfile] = useState<any>(initialProfile || null);
  const [loading, setLoading] = useState<boolean>(!initialProfile && !!targetIdOrName);
  const [activeTab, setActiveTab] = useState<'house' | 'inventory' | 'vehicle' | 'stats'>('house');

  useEffect(() => {
    if (targetIdOrName) {
      setLoading(true);
      fetch(`/api/game/profile/${encodeURIComponent(targetIdOrName)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.profile) {
            setProfile(data.profile);
          } else if (!profile) {
            onShowMessage('Không thể tải thông tin người chơi này.');
            onClose();
          }
        })
        .catch(() => {
          if (!profile) {
            onShowMessage('Lỗi kết nối khi soi đồ người chơi.');
            onClose();
          }
        })
        .finally(() => setLoading(false));
    }
  }, [targetIdOrName]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
        <div className="bg-[#1e1008] pixel-box-gold p-6 text-center max-w-sm w-full">
          <div className="animate-spin text-4xl mb-3">🔍</div>
          <p className="font-pixel text-xs text-yellow-300">Đang soi thông tin & nhà cửa...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const equippedHouse = ALL_HOUSES.find((h) => h.id === profile.equippedHouseId) || ALL_HOUSES[0];
  const equippedVehicle = ALL_VEHICLES.find((v) => v.id === profile.equippedVehicleId);
  const ownedHouses = (profile.houses || [profile.equippedHouseId || 'house_leaf']).map(
    (id: string) => ALL_HOUSES.find((h) => h.id === id)
  ).filter(Boolean);
  const ownedVehicles = (profile.vehicles || (profile.equippedVehicleId ? [profile.equippedVehicleId] : [])).map(
    (id: string) => ALL_VEHICLES.find((v) => v.id === id)
  ).filter(Boolean);

  const inventory: InventoryItem[] = profile.inventory || [];
  const stats = profile.stats || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#1c0c05] pixel-box-gold w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">
        {/* Top Header */}
        <div className="bg-[#36190a] p-3 border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl filter drop-shadow">🔎</span>
            <div>
              <h2 className="font-black text-yellow-300 text-xs sm:text-sm font-pixel pixel-shadow-sm flex items-center gap-1.5">
                <span>Hồ Sơ & Kho Đồ Cư Dân</span>
                {profile.role === 'admin' && (
                  <span className="bg-red-600 text-white font-pixel text-[8px] px-1.5 py-0.5 rounded border border-black">
                    ADMIN
                  </span>
                )}
              </h2>
              <p className="font-vt323 text-base text-amber-200/80 leading-tight">
                Chiêm ngưỡng bất động sản, siêu xe và kho báu sở hữu
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

        {/* Character Card Banner */}
        <div className="bg-linear-to-b from-[#2b1208] to-[#160a04] p-3 border-b-2 border-black flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          {/* Avatar Sprite Box */}
          <div className="relative bg-[#0d0502] pixel-box p-3 sm:p-4 shrink-0 flex items-center justify-center min-w-[110px] min-h-[120px]">
            <CharacterSprite
              appearance={profile.appearance || {}}
              nickname={profile.nickname}
              level={profile.level || 1}
              scale={1.1}
              vehicleId={profile.equippedVehicleId}
            />
            {profile.role === 'admin' && (
              <div className="absolute top-1 left-1">
                <ShieldCheck className="w-4 h-4 text-red-400" />
              </div>
            )}
          </div>

          {/* Profile Overview */}
          <div className="flex-1 w-full space-y-1.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <span className="font-pixel text-sm sm:text-base text-yellow-300 font-black">
                {profile.nickname}
              </span>
              <span className="bg-amber-800/80 text-amber-200 font-pixel text-[8px] px-1.5 py-0.5 border border-amber-900">
                Lv.{profile.level || 1}
              </span>
              <span className="font-vt323 text-base text-amber-400">
                ({profile.gender === 'female' ? 'Nữ ♀️' : 'Nam ♂️'})
              </span>
            </div>

            {/* Financial Badges */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <div className="bg-[#120703] px-2 py-1 rounded border border-amber-900/60 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <div className="truncate">
                  <span className="font-pixel text-[7.5px] text-amber-400 block">Tài Sản Xu:</span>
                  <span className="font-pixel text-[9px] text-yellow-300 font-bold">
                    {(profile.xu || 0).toLocaleString('vi-VN')} Xu
                  </span>
                </div>
              </div>

              <div className="bg-[#120703] px-2 py-1 rounded border border-amber-900/60 flex items-center gap-1.5">
                <Gem className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <div className="truncate">
                  <span className="font-pixel text-[7.5px] text-pink-400 block">Đá Quý Lượng:</span>
                  <span className="font-pixel text-[9px] text-pink-300 font-bold">
                    {(profile.luong || 0).toLocaleString('vi-VN')} Lượng
                  </span>
                </div>
              </div>
            </div>

            {/* Status line */}
            <div className="flex items-center justify-center sm:justify-start gap-3 font-vt323 text-base text-amber-200/90 pt-0.5">
              <span>🏠 Đang ở: <b className="text-yellow-300">{equippedHouse?.name}</b></span>
              <span>🏎️ Cưỡi: <b className="text-sky-300">{equippedVehicle?.name || 'Đi bộ'}</b></span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 bg-[#120703] p-1.5 border-b-2 border-black">
          {[
            { id: 'house' as const, label: '🏰 Bất Động Sản', count: ownedHouses.length },
            { id: 'inventory' as const, label: '🎒 Rương Đồ', count: inventory.length },
            { id: 'vehicle' as const, label: '🏎️ Xe Cộ', count: ownedVehicles.length },
            { id: 'stats' as const, label: '🌾 Thành Tích' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { sounds.playClick(); setActiveTab(t.id); }}
              className={`pixel-btn flex-1 py-1 font-pixel text-[8.5px] sm:text-[9px] transition-all flex items-center justify-center gap-1 ${
                activeTab === t.id
                  ? 'bg-yellow-600 text-yellow-100 shadow'
                  : 'bg-[#221008] text-amber-400 hover:text-white'
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className="bg-black/60 px-1 rounded-full text-[7.5px]">({t.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-3 overflow-y-auto max-h-[45vh] space-y-2">
          {/* TAB 1: HOUSES & REAL ESTATE */}
          {activeTab === 'house' && (
            <div className="space-y-2">
              <div className="bg-[#241208] p-2.5 pixel-box border-amber-900/60 mb-2">
                <span className="font-pixel text-[8.5px] text-yellow-400 block mb-1">
                  🌟 BẤT ĐỘNG SẢN ĐANG SỬ DỤNG:
                </span>
                <div className="flex items-center gap-3 bg-[#130803] p-2 rounded border border-amber-950">
                  <span className="text-3xl filter drop-shadow">{equippedHouse?.icon || '🏠'}</span>
                  <div>
                    <h4 className="font-pixel text-[10px] text-yellow-300 font-bold">
                      {equippedHouse?.name}
                    </h4>
                    <p className="font-vt323 text-base text-gray-300">
                      {equippedHouse?.description}
                    </p>
                    <span className="font-pixel text-[7.5px] text-emerald-400">
                      ⚡ Thể lực tối đa: {equippedHouse?.maxEnergy} | Hồi phục: {equippedHouse?.energyBonusSpeed}x
                    </span>
                  </div>
                </div>
              </div>

              <span className="font-pixel text-[8.5px] text-amber-300 block">
                📋 TOÀN BỘ NHÀ ĐÃ SỞ HỮU ({ownedHouses.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ownedHouses.map((h: any, idx: number) => {
                  const isCurrent = h.id === profile.equippedHouseId;
                  return (
                    <div
                      key={idx}
                      className={`p-2 pixel-plot flex items-center gap-2.5 ${
                        isCurrent ? 'bg-[#3b1d0c] border-yellow-400' : 'bg-[#180b05]'
                      }`}
                    >
                      <span className="text-2xl">{h.icon}</span>
                      <div className="flex-1 truncate">
                        <div className="flex items-center justify-between">
                          <h5 className="font-pixel text-[9px] text-yellow-200 truncate">{h.name}</h5>
                          {isCurrent && (
                            <span className="bg-yellow-500 text-black font-pixel text-[7px] px-1 rounded">
                              ĐANG Ở
                            </span>
                          )}
                        </div>
                        <span className="font-vt323 text-sm text-gray-400 block truncate">
                          Max Energy: {h.maxEnergy}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY & ITEMS */}
          {activeTab === 'inventory' && (
            <div className="space-y-2">
              {inventory.length === 0 ? (
                <div className="bg-[#180b05] p-6 text-center pixel-plot text-gray-400">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-pixel text-[9px] text-amber-300">Rương đồ hiện đang trống</p>
                  <p className="font-vt323 text-base">Người chơi chưa mang theo vật phẩm nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {inventory.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#1a0c06] p-2 pixel-box border-amber-950 flex items-center gap-2 hover:border-yellow-500 transition-colors"
                    >
                      <span className="text-2xl shrink-0 filter drop-shadow">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-pixel text-[8.5px] text-yellow-200 truncate" title={item.name}>
                          {item.name}
                        </h5>
                        <div className="flex items-center justify-between font-vt323 text-sm">
                          <span className="text-emerald-400">x{item.count}</span>
                          <span className="text-amber-400/90">{item.sellPrice} Xu</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VEHICLES & MOUNTS */}
          {activeTab === 'vehicle' && (
            <div className="space-y-2">
              {ownedVehicles.length === 0 ? (
                <div className="bg-[#180b05] p-6 text-center pixel-plot text-gray-400">
                  <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-pixel text-[9px] text-amber-300">Chưa có phương tiện trong Gara</p>
                  <p className="font-vt323 text-base">Người chơi đang di chuyển bằng cách đi bộ</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ownedVehicles.map((v: any, idx: number) => {
                    const isEquipped = v.id === profile.equippedVehicleId;
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 pixel-plot flex items-center gap-3 ${
                          isEquipped ? 'bg-[#3b1d0c] border-yellow-400' : 'bg-[#180b05]'
                        }`}
                      >
                        <span className="text-3xl filter drop-shadow">{v.icon}</span>
                        <div className="flex-1 truncate">
                          <div className="flex items-center justify-between">
                            <h5 className="font-pixel text-[9px] text-yellow-200 truncate">{v.name}</h5>
                            {isEquipped && (
                              <span className="bg-sky-500 text-black font-pixel text-[7px] px-1 rounded">
                                ĐANG CƯỠI
                              </span>
                            )}
                          </div>
                          <span className="font-pixel text-[7.5px] text-sky-300 block">
                            +{v.speedBonus}% Tốc độ di chuyển
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FARM & PLAYER STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-[#180b05] p-2.5 pixel-plot text-center">
                  <span className="font-pixel text-[7.5px] text-amber-400 block mb-0.5">🌾 CÂY ĐÃ THU HOẠCH</span>
                  <span className="font-pixel text-xs text-yellow-300 font-bold">
                    {(stats.cropsHarvested || 0).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="bg-[#180b05] p-2.5 pixel-plot text-center">
                  <span className="font-pixel text-[7.5px] text-amber-400 block mb-0.5">🐟 CÁ ĐÃ CÂU ĐƯỢC</span>
                  <span className="font-pixel text-xs text-yellow-300 font-bold">
                    {(stats.fishCaught || 0).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="bg-[#180b05] p-2.5 pixel-plot text-center">
                  <span className="font-pixel text-[7.5px] text-amber-400 block mb-0.5">🎲 THẮNG MINIGAME</span>
                  <span className="font-pixel text-xs text-yellow-300 font-bold">
                    {(stats.miniGamesWon || 0).toLocaleString('vi-VN')} ván
                  </span>
                </div>

                <div className="bg-[#180b05] p-2.5 pixel-plot text-center">
                  <span className="font-pixel text-[7.5px] text-amber-400 block mb-0.5">🐔 ĐÀN GÀ NUÔI</span>
                  <span className="font-pixel text-xs text-yellow-300 font-bold">
                    {profile.chickensCount ?? (profile.chickens ? profile.chickens.length : 0)} con
                  </span>
                </div>

                <div className="bg-[#180b05] p-2.5 pixel-plot text-center">
                  <span className="font-pixel text-[7.5px] text-amber-400 block mb-0.5">🐷 ĐÀN HEO NUÔI</span>
                  <span className="font-pixel text-xs text-yellow-300 font-bold">
                    {profile.pigsCount ?? (profile.pigs ? profile.pigs.length : 0)} con
                  </span>
                </div>

                <div className="bg-[#180b05] p-2.5 pixel-plot text-center">
                  <span className="font-pixel text-[7.5px] text-amber-400 block mb-0.5">🌱 Ô ĐẤT NÔNG TRẠI</span>
                  <span className="font-pixel text-xs text-yellow-300 font-bold">
                    {profile.farmPlotsCount ?? (profile.farmPlots ? profile.farmPlots.length : 6)} ô
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#120703] p-2.5 border-t-2 border-black flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1">
            <button
              onClick={() => {
                sounds.playWin();
                onShowMessage(`❤️ Bạn đã gửi 1 trái tim ái mộ tới ${profile.nickname}!`);
              }}
              className="pixel-btn bg-rose-700 hover:bg-rose-600 text-white font-pixel text-[8.5px] py-1.5 px-3 flex items-center gap-1 shadow flex-1 justify-center"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span>Thả Tim</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onShowMessage(`👋 Bạn vừa vẫy tay chào hỏi ${profile.nickname}!`);
              }}
              className="pixel-btn bg-amber-600 hover:bg-amber-500 text-white font-pixel text-[8.5px] py-1.5 px-3 flex items-center gap-1 shadow flex-1 justify-center"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chào Hỏi</span>
            </button>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="pixel-btn bg-gray-800 hover:bg-gray-700 text-white font-pixel text-[8.5px] py-1.5 px-3"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
