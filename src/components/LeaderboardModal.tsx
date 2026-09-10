import React, { useState } from 'react';
import { UserProfile } from '../types';
import { sounds } from '../utils/audio';
import { Trophy, Medal, Coins, Fish, Sprout, Crown } from 'lucide-react';

interface LeaderboardModalProps {
  user: UserProfile;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ user, onClose }) => {
  const [tab, setTab] = useState<'xu' | 'fish' | 'farm'>('xu');

  const leaderboards = {
    xu: [
      { rank: 1, name: 'CongTuBacLieu', score: '2,500,000 Xu', title: 'Than Tai Avatar', badge: '👑' },
      { rank: 2, name: 'DaiGiaXuDua', score: '1,820,000 Xu', title: 'Trieu Phu Nong Trai', badge: '🥈' },
      { rank: 3, name: user.nickname, score: `${user.xu.toLocaleString('vi-VN')} Xu`, title: 'Can Thu Noi Bat', badge: '🥉', isMe: true },
      { rank: 4, name: 'CoBaSaiGon', score: '950,000 Xu', title: 'Chu Tiem Vang', badge: '4' },
      { rank: 5, name: 'ThoSanThuyQuai', score: '780,000 Xu', title: 'Ba Chu Ho Cau', badge: '5' },
    ],
    fish: [
      { rank: 1, name: 'CanThuVip99', score: '1,450 con ca', title: 'Than Cau Song Nuoc', badge: '👑' },
      { rank: 2, name: 'NguOngDacLoi', score: '980 con ca', title: 'Sat Thu Ca Chep', badge: '🥈' },
      { rank: 3, name: user.nickname, score: `${user.stats.fishCaught} con ca`, title: 'Can Thu Tinh Anh', badge: '🥉', isMe: true },
      { rank: 4, name: 'BeMeoDiCau', score: '420 con ca', title: 'Cau Ca Giai Tri', badge: '4' },
      { rank: 5, name: 'HaiLuaMienTay', score: '310 con ca', title: 'Tap Su Ven Ho', badge: '5' },
    ],
    farm: [
      { rank: 1, name: 'VuaNongTrai', score: '3,200 cay hoa mau', title: 'Huyen Thoai Ruong Dong', badge: '👑' },
      { rank: 2, name: 'BacBaNongDan', score: '2,100 cay hoa mau', title: 'Lao Nong Tri Ky', badge: '🥈' },
      { rank: 3, name: user.nickname, score: `${user.stats.cropsHarvested} cay hoa mau`, title: 'Nong Dan Can Man', badge: '🥉', isMe: true },
      { rank: 4, name: 'HoaKhoiDongXanh', score: '890 cay hoa mau', title: 'Tho Trong Hoa Hong', badge: '4' },
      { rank: 5, name: 'TiaEmTrongDua', score: '740 cay hoa mau', title: 'Chua Te Dua Hau', badge: '5' },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#24130a] pixel-box-gold w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#361a0b] p-3 border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl filter drop-shadow">🏆</span>
            <div>
              <h2 className="font-black text-yellow-300 text-xs sm:text-sm font-pixel pixel-shadow-sm">
                Bang Vang Danh Du Avatar
              </h2>
              <p className="font-vt323 text-base text-amber-200/80">
                Ton vinh cac Phu hao, Can thu va Nong dan kiet xuat nhat
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
            { id: 'fish' as const, label: '🐟 Top Ca', icon: Fish },
            { id: 'farm' as const, label: '🌾 Top Nong', icon: Sprout },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { sounds.playClick(); setTab(t.id); }}
              className={`pixel-btn flex-1 py-1 font-pixel text-[9px] transition-all ${
                tab === t.id
                  ? 'bg-yellow-600 text-yellow-100'
                  : 'bg-[#221008] text-amber-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="p-3 space-y-2 max-h-[55vh] overflow-y-auto">
          {leaderboards[tab].map((item) => (
            <div
              key={item.rank}
              className={`p-2.5 pixel-plot flex items-center justify-between ${
                item.isMe
                  ? 'bg-[#4d2d1b] border-yellow-400'
                  : 'bg-[#221008]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 bg-black/60 border border-black flex items-center justify-center font-pixel text-xs font-black text-yellow-300">
                  {item.badge}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-pixel text-[9px] text-amber-200">
                      {item.name}
                    </h4>
                    {item.isMe && (
                      <span className="bg-yellow-500 text-black font-pixel text-[7px] px-1 py-0.5 border border-black">
                        BAN
                      </span>
                    )}
                  </div>
                  <span className="font-vt323 text-base text-amber-400/90">{item.title}</span>
                </div>
              </div>

              <span className="font-pixel text-[10px] font-bold text-yellow-300">
                {item.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
