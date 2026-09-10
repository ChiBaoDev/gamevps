import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { sounds } from '../utils/audio';
import { Trophy, Coins, Fish, Sprout, Crown, Eye, Zap } from 'lucide-react';
import { ALL_HOUSES, ALL_VEHICLES } from '../utils/gameData';

interface LeaderboardModalProps {
  user: UserProfile;
  onClose: () => void;
  onInspectPlayer: (playerIdOrName: string, initialProfile?: any) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ user, onClose, onInspectPlayer }) => {
  const [tab, setTab] = useState<'xu' | 'fish' | 'farm' | 'level'>('xu');
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/game/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.leaderboard) {
          setLeaderboardData(data.leaderboard);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getBadges = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const getListForTab = () => {
    if (!leaderboardData) {
      // Default fallback
      return [
        { rank: 1, id: 'bot_congtu', nickname: 'Công Tử Bạc Liêu', xu: 2500000, level: 99, equippedHouseId: 'house_castle', equippedVehicleId: 'veh_pegasus', score: '2.500.000 Xu', subtitle: 'Thần Tài Avatar' },
        { rank: 2, id: 'bot_coba', nickname: 'Cô Ba Sài Gòn', xu: 1820000, level: 68, equippedHouseId: 'house_villa', equippedVehicleId: 'veh_sh', score: '1.820.000 Xu', subtitle: 'Phú Hào Quận 1' },
        { rank: 3, id: user.id, nickname: user.nickname, xu: user.xu, level: user.level, equippedHouseId: user.equippedHouseId, equippedVehicleId: user.equippedVehicleId, score: `${user.xu.toLocaleString('vi-VN')} Xu`, subtitle: 'Bạn', isMe: true },
        { rank: 4, id: 'bot_nongdan', nickname: 'Bác Ba Nông Dân', xu: 950000, level: 45, equippedHouseId: 'house_tile', equippedVehicleId: 'veh_cub50', score: '950.000 Xu', subtitle: 'Chủ Vựa Nông Sản' },
      ];
    }

    let items = [];
    if (tab === 'xu') {
      items = (leaderboardData.topXu || []).map((p: any, idx: number) => ({
        ...p,
        rank: idx + 1,
        score: `${(p.xu || 0).toLocaleString('vi-VN')} Xu`,
        subtitle: idx === 0 ? '👑 Thiên Hạ Đệ Nhất Phú Hào' : idx === 1 ? '🥈 Đại Gia Xu Nghìn Tỷ' : idx === 2 ? '🥉 Triệu Phú Nông Nghiệp' : 'Cư Dân Giàu Có',
      }));
    } else if (tab === 'fish') {
      items = (leaderboardData.topFish || []).map((p: any, idx: number) => {
        const fishCount = (p.stats && p.stats.fishCaught) || 0;
        return {
          ...p,
          rank: idx + 1,
          score: `${fishCount.toLocaleString('vi-VN')} con cá`,
          subtitle: idx === 0 ? '👑 Vua Sát Cá Đại Dương' : idx === 1 ? '🥈 Cần Thủ Tinh Anh' : 'Sát Thủ Ven Hồ',
        };
      });
    } else if (tab === 'farm') {
      items = (leaderboardData.topFarm || []).map((p: any, idx: number) => {
        const cropCount = (p.stats && p.stats.cropsHarvested) || 0;
        return {
          ...p,
          rank: idx + 1,
          score: `${cropCount.toLocaleString('vi-VN')} hoa màu`,
          subtitle: idx === 0 ? '👑 Thần Nông Đại Lục' : idx === 1 ? '🥈 Lão Nông Tri Kỷ' : 'Nông Dân Cần Mẫn',
        };
      });
    } else {
      items = (leaderboardData.topLevel || []).map((p: any, idx: number) => ({
        ...p,
        rank: idx + 1,
        score: `Cấp Lv.${p.level || 1}`,
        subtitle: idx === 0 ? '👑 Đỉnh Phong Cảnh Giới' : 'Cao Thủ Lão Luyện',
      }));
    }

    return items;
  };

  const currentList = getListForTab();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#24130a] pixel-box-gold w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-[#361a0b] p-3 border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl filter drop-shadow">🏆</span>
            <div>
              <h2 className="font-black text-yellow-300 text-xs sm:text-sm font-pixel pixel-shadow-sm">
                Bảng Vàng Danh Dự Avatar
              </h2>
              <p className="font-vt323 text-base text-amber-200/80">
                Nhấn vào bất kỳ người chơi nào để <b className="text-yellow-300">Soi Đồ & Nhà Cửa</b>!
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

        {/* Tab Selection */}
        <div className="flex items-center gap-1 bg-[#150a04] p-2 border-b-2 border-black">
          {[
            { id: 'xu' as const, label: '💰 Top Xu', icon: Coins },
            { id: 'fish' as const, label: '🐟 Top Cá', icon: Fish },
            { id: 'farm' as const, label: '🌾 Top Nông', icon: Sprout },
            { id: 'level' as const, label: '⭐ Cấp Độ', icon: Trophy },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { sounds.playClick(); setTab(t.id); }}
              className={`pixel-btn flex-1 py-1 font-pixel text-[8.5px] sm:text-[9px] transition-all ${
                tab === t.id
                  ? 'bg-yellow-600 text-yellow-100 shadow'
                  : 'bg-[#221008] text-amber-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List of players */}
        <div className="p-3 space-y-2 max-h-[55vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <span className="font-pixel text-xs text-yellow-300 animate-pulse">Đang tải bảng xếp hạng...</span>
            </div>
          ) : (
            currentList.map((item: any) => {
              const isMe = item.id === user.id || item.nickname === user.nickname;
              const houseDef = ALL_HOUSES.find((h) => h.id === item.equippedHouseId);
              const vehicleDef = ALL_VEHICLES.find((v) => v.id === item.equippedVehicleId);

              return (
                <div
                  key={item.id || item.rank}
                  onClick={() => {
                    sounds.playClick();
                    onInspectPlayer(item.id || item.nickname, item);
                  }}
                  className={`p-2.5 pixel-plot flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-yellow-300 group ${
                    isMe ? 'bg-[#4d2d1b] border-yellow-400' : 'bg-[#221008] hover:bg-[#2d150b]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 bg-black/60 border border-black flex items-center justify-center font-pixel text-xs font-black text-yellow-300 shrink-0">
                      {getBadges(item.rank)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-pixel text-[9.5px] text-amber-200 group-hover:text-yellow-300 transition-colors truncate">
                          {item.nickname}
                        </h4>
                        <span className="bg-amber-950 text-amber-300 text-[7.5px] font-pixel px-1 py-0.2 border border-amber-900">
                          Lv.{item.level || 1}
                        </span>
                        {isMe && (
                          <span className="bg-yellow-500 text-black font-pixel text-[7px] px-1 py-0.2 border border-black">
                            BẠN
                          </span>
                        )}
                        {houseDef && (
                          <span title={houseDef.name} className="text-xs">
                            {houseDef.icon}
                          </span>
                        )}
                        {vehicleDef && (
                          <span title={vehicleDef.name} className="text-xs">
                            {vehicleDef.icon}
                          </span>
                        )}
                      </div>
                      <span className="font-vt323 text-sm text-amber-400/90 block truncate">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-pixel text-[9.5px] sm:text-[10px] font-bold text-yellow-300 text-right">
                      {item.score}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-300 font-pixel text-[7.5px] px-1.5 py-1 border border-yellow-500/50 group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                      <Eye className="w-3 h-3" />
                      <span>Soi</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

