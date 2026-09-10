import React, { useState } from 'react';
import { UserProfile, DailyQuest } from '../types';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Scroll, 
  CheckCircle2, 
  Coins, 
  Sparkles, 
  Trophy, 
  Calendar, 
  Compass, 
  Lock, 
  Gift, 
  ArrowRight,
  Flame,
  Check
} from 'lucide-react';

interface QuestModalProps {
  user: UserProfile;
  token?: string;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onClose: () => void;
  onShowMessage: (msg: string) => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({
  user,
  token,
  onUpdateUser,
  onClose,
  onShowMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'daily'>('main');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Phân chia nhiệm vụ
  const allQuests = user.quests || [];
  
  const mainQuests = allQuests
    .filter(q => q.category === 'main' || q.id.startsWith('main_'))
    .sort((a, b) => (a.order || a.chapter || 0) - (b.order || b.chapter || 0));

  const dailyQuests = allQuests
    .filter(q => q.category === 'daily' || !q.id.startsWith('main_'));

  // Đếm nhiệm vụ chưa nhận thưởng
  const unclaimedMainCount = mainQuests.filter(q => q.completed && !q.claimed).length;
  const unclaimedDailyCount = dailyQuests.filter(q => q.completed && !q.claimed).length;

  // Xử lý nhận thưởng nhiệm vụ
  const handleClaimReward = async (quest: DailyQuest) => {
    if (!quest.completed || quest.claimed || claimingId) return;

    setClaimingId(quest.id);
    sounds.playWin();

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF4500', '#00FF7F', '#1E90FF']
      });
    } catch {}

    // Gọi API backend
    if (token) {
      try {
        const res = await fetch('/api/game/claim-quest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ questId: quest.id }),
        });

        const data = await res.json();
        if (data.success && data.user) {
          onUpdateUser(data.user);
          onShowMessage(data.message || `🎁 Nhận thưởng thành công nhiệm vụ: ${quest.title}!`);
          setClaimingId(null);
          return;
        }
      } catch (err) {
        console.warn('Lỗi gọi API claim-quest, chuyển sang fallback:', err);
      }
    }

    // Fallback Client-side nếu offline hoặc không có token
    const updatedQuests = user.quests.map((q) => {
      if (q.id === quest.id) {
        return { ...q, claimed: true, completed: true };
      }
      return q;
    });

    let newExp = user.exp + quest.rewardExp;
    let newLevel = user.level;
    let newMaxExp = user.maxExp;
    let newLuong = user.luong + (quest.rewardLuong || 0);

    if (newExp >= user.maxExp) {
      newLevel += 1;
      newExp -= user.maxExp;
      newMaxExp = Math.round(newMaxExp * 1.5);
      newLuong += 2;
      sounds.playLevelUp();
      onShowMessage(`🎉 CHÚC MỪNG LÊN CẤP ${newLevel}! Nhận thêm +2 LƯỢNG thưởng!`);
    }

    onUpdateUser({
      xu: user.xu + quest.rewardXu,
      luong: newLuong,
      exp: newExp,
      level: newLevel,
      maxExp: newMaxExp,
      quests: updatedQuests,
    });

    onShowMessage(`🎁 Đã nhận thưởng ${quest.rewardXu.toLocaleString()} Xu, ${quest.rewardLuong || 0} Lượng & +${quest.rewardExp} EXP!`);
    setClaimingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 backdrop-blur-sm">
      <div className="bg-[#24130a] pixel-box-gold w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl border-4 border-[#eab308]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3b1c09] via-[#4a240d] to-[#3b1c09] p-3 sm:p-4 border-b-2 border-amber-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-2xl shadow-inner">
              📜
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-yellow-300 text-sm sm:text-base font-pixel tracking-wide pixel-shadow-sm">
                  HỆ THỐNG NHIỆM VỤ AVATAR
                </h2>
                <span className="bg-red-600 text-white font-pixel text-[8px] px-1.5 py-0.5 rounded shadow">
                  MỚI
                </span>
              </div>
              <p className="font-vt323 text-base sm:text-lg text-amber-200/90 leading-tight">
                Chinh phục cốt truyện & Làm mới nhiệm vụ hằng ngày mỗi 24h
              </p>
            </div>
          </div>

          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="pixel-btn bg-red-800 hover:bg-red-700 text-white font-pixel text-xs px-3 py-1.5 shadow"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-black bg-[#1a0c06] p-1.5 gap-2 shrink-0">
          <button
            onClick={() => { sounds.playClick(); setActiveTab('main'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 font-pixel text-[10px] sm:text-xs transition-all ${
              activeTab === 'main'
                ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-black font-black shadow-md border-2 border-yellow-300'
                : 'bg-[#2d150b] text-amber-300/70 hover:bg-[#3d1e10] hover:text-amber-200 border border-amber-900/50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>🌟 CỐT TRUYỆN CHÍNH ({mainQuests.filter(q => q.claimed).length}/{mainQuests.length || 10})</span>
            {unclaimedMainCount > 0 && (
              <span className="bg-red-600 text-white font-pixel text-[8px] px-1.5 py-0.2 rounded-full animate-bounce">
                {unclaimedMainCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { sounds.playClick(); setActiveTab('daily'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 font-pixel text-[10px] sm:text-xs transition-all ${
              activeTab === 'daily'
                ? 'bg-gradient-to-b from-sky-500 to-sky-700 text-black font-black shadow-md border-2 border-cyan-300'
                : 'bg-[#2d150b] text-amber-300/70 hover:bg-[#3d1e10] hover:text-amber-200 border border-amber-900/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>📅 NHIỆM VỤ HẰNG NGÀY ({dailyQuests.filter(q => q.completed).length}/{dailyQuests.length || 5})</span>
            {unclaimedDailyCount > 0 && (
              <span className="bg-red-600 text-white font-pixel text-[8px] px-1.5 py-0.2 rounded-full animate-bounce">
                {unclaimedDailyCount}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1 bg-[#1c0e07]/60">

          {/* ================= TAB 1: NHIỆM VỤ CHÍNH TUYẾN ================= */}
          {activeTab === 'main' && (
            <div className="space-y-3">
              {/* Banner Giới Thiệu Cốt Truyện */}
              <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/50 to-amber-950/80 p-3 border border-amber-600/40 rounded flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-yellow-400 font-pixel text-[10px]">
                    <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                    <span>HÀNH TRÌNH TÂN THỦ ➔ ĐẠI PHÚ HÀO AVATAR</span>
                  </div>
                  <p className="font-vt323 text-amber-200/90 text-sm sm:text-base">
                    Vượt qua 10 chương cốt truyện để nhận Lượng, Cần câu quý, Cánh Ác Ma và Vương Miện!
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-pixel text-[10px] text-amber-400 block">TIẾN TRÌNH</span>
                  <span className="font-pixel text-xs sm:text-sm text-yellow-300 font-black">
                    {Math.round((mainQuests.filter(q => q.claimed).length / (mainQuests.length || 10)) * 100)}%
                  </span>
                </div>
              </div>

              {/* Danh sách các Chương Cốt Truyện */}
              <div className="space-y-2.5">
                {mainQuests.map((quest, index) => {
                  const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100));
                  
                  // Xác định trạng thái chương:
                  // 1. Đã nhận thưởng: quest.claimed
                  // 2. Đang chờ nhận thưởng: quest.completed && !quest.claimed
                  // 3. Đang thực hiện: Không phải locked và chưa completed
                  // 4. Khóa: Nếu các chương trước chưa hoàn thành/nhận
                  const prevQuests = mainQuests.slice(0, index);
                  const isUnlocked = index === 0 || prevQuests.every(pq => pq.claimed);

                  return (
                    <div
                      key={quest.id}
                      className={`p-3 rounded transition-all border ${
                        quest.claimed
                          ? 'bg-[#150a04]/90 border-amber-950/60 opacity-70'
                          : quest.completed
                          ? 'bg-gradient-to-r from-[#44220b] to-[#592f0f] border-yellow-400 shadow-lg ring-1 ring-yellow-400/50'
                          : isUnlocked
                          ? 'bg-[#2b160b] border-amber-700/80 shadow'
                          : 'bg-[#180d07] border-gray-800/80 opacity-50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        
                        {/* Header & Icon */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-12 h-12 shrink-0 rounded flex items-center justify-center text-2xl border ${
                            quest.claimed
                              ? 'bg-black/40 border-amber-950'
                              : quest.completed
                              ? 'bg-yellow-500/20 border-yellow-400 animate-pulse'
                              : isUnlocked
                              ? 'bg-black/50 border-amber-600'
                              : 'bg-black/60 border-gray-700'
                          }`}>
                            {!isUnlocked ? (
                              <Lock className="w-5 h-5 text-gray-500" />
                            ) : quest.claimed ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            ) : (
                              quest.icon || '📜'
                            )}
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            {/* Chapter Tag */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-pixel text-[8px] px-1.5 py-0.5 rounded uppercase ${
                                quest.claimed 
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : isUnlocked 
                                  ? 'bg-amber-950 text-yellow-400 border border-amber-700'
                                  : 'bg-gray-900 text-gray-400 border border-gray-800'
                              }`}>
                                {quest.chapterTitle || `CHƯƠNG ${quest.chapter || index + 1}`}
                              </span>
                              
                              <h4 className={`font-pixel text-[10px] sm:text-xs truncate ${
                                quest.claimed ? 'text-gray-400 line-through' : 'text-amber-100 font-bold'
                              }`}>
                                {quest.title}
                              </h4>
                            </div>

                            {/* Description */}
                            <p className="font-vt323 text-sm text-amber-300/80 leading-snug">
                              {quest.description || 'Hoàn thành chỉ tiêu mục tiêu để tiến bước trên con đường làm giàu.'}
                            </p>

                            {/* Progress bar */}
                            {isUnlocked && (
                              <div className="space-y-1 pt-1">
                                <div className="flex items-center justify-between text-[8px] font-pixel">
                                  <span className="text-amber-300/70">Tiến độ thực hiện:</span>
                                  <span className="text-yellow-400 font-bold">
                                    {quest.progress} / {quest.target} ({percent}%)
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-black/60 rounded-full border border-amber-950 overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 rounded-full ${
                                      quest.completed ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-yellow-500 to-amber-400'
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Phần Thưởng */}
                            <div className="flex items-center gap-2.5 pt-1 font-pixel text-[8px] flex-wrap">
                              <span className="text-amber-400/80">Phần thưởng:</span>
                              {quest.rewardXu > 0 && (
                                <span className="bg-amber-950/80 text-yellow-300 px-1.5 py-0.5 rounded border border-amber-700 flex items-center gap-1">
                                  🪙 +{quest.rewardXu.toLocaleString()} Xu
                                </span>
                              )}
                              {quest.rewardLuong && quest.rewardLuong > 0 ? (
                                <span className="bg-purple-950/80 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700 flex items-center gap-1 font-black">
                                  💎 +{quest.rewardLuong} Lượng
                                </span>
                              ) : null}
                              {quest.rewardExp > 0 && (
                                <span className="bg-sky-950/80 text-sky-300 px-1.5 py-0.5 rounded border border-sky-700 flex items-center gap-1">
                                  ⭐ +{quest.rewardExp} EXP
                                </span>
                              )}
                              {quest.rewardItemName && (
                                <span className="bg-red-950/80 text-rose-300 px-1.5 py-0.5 rounded border border-rose-700 flex items-center gap-1 font-bold">
                                  🎁 {quest.rewardItemName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Claim Button */}
                        <div className="shrink-0 flex sm:flex-col items-end justify-center">
                          {quest.claimed ? (
                            <span className="font-pixel text-[8px] sm:text-[9px] text-emerald-400 px-3 py-1.5 bg-emerald-950/50 border border-emerald-800 rounded flex items-center gap-1">
                              <Check className="w-3 h-3" /> ĐÃ NHẬN
                            </span>
                          ) : quest.completed ? (
                            <button
                              onClick={() => handleClaimReward(quest)}
                              disabled={claimingId === quest.id}
                              className="pixel-btn bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-pixel text-[9px] sm:text-[10px] px-3.5 py-2 font-black shadow-lg animate-bounce border-2 border-white cursor-pointer"
                            >
                              🎁 NHẬN THƯỞNG
                            </button>
                          ) : isUnlocked ? (
                            <span className="font-pixel text-[8px] text-amber-400/70 px-2.5 py-1 bg-black/40 border border-amber-900/60 rounded">
                              ĐANG LÀM
                            </span>
                          ) : (
                            <span className="font-pixel text-[8px] text-gray-500 px-2.5 py-1 bg-black/50 border border-gray-800 rounded flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> CHƯA MỞ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 2: NHIỆM VỤ HẰNG NGÀY ================= */}
          {activeTab === 'daily' && (
            <div className="space-y-3">
              {/* Daily Milestone Chest Box */}
              <div className="bg-gradient-to-r from-[#2e1809] via-[#43200a] to-[#2e1809] p-3.5 border-2 border-amber-500 rounded-lg shadow-md flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎁</span>
                    <h3 className="font-pixel text-yellow-300 text-xs sm:text-sm font-bold">
                      HÒM QUÀ SIÊU CẤP NGÀY
                    </h3>
                  </div>
                  <p className="font-vt323 text-amber-200/90 text-sm sm:text-base">
                    Hoàn thành tất cả 5 nhiệm vụ hằng ngày để nhận thưởng ngày trọn vẹn!
                  </p>
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-pixel text-[8px]">
                    <span>Làm mới mỗi ngày lúc 00:00 (chu kỳ 24h)</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="bg-black/50 px-3 py-1.5 rounded border border-amber-700/60">
                    <span className="font-pixel text-[8px] text-amber-400 block">HOÀN THÀNH</span>
                    <span className="font-pixel text-sm sm:text-base text-yellow-300 font-black">
                      {dailyQuests.filter(q => q.completed).length}/{dailyQuests.length || 5}
                    </span>
                  </div>
                </div>
              </div>

              {/* Danh sách 5 nhiệm vụ ngày */}
              <div className="space-y-2.5">
                {dailyQuests.map((quest) => {
                  const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100));

                  return (
                    <div
                      key={quest.id}
                      className={`p-3 rounded border transition-all ${
                        quest.claimed
                          ? 'bg-[#150a04]/90 border-amber-950/60 opacity-70'
                          : quest.completed
                          ? 'bg-gradient-to-r from-[#3f220d] to-[#4e2c14] border-yellow-400 shadow-md ring-1 ring-yellow-400/40'
                          : 'bg-[#271309] border-amber-800/60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl p-2 bg-black/50 border border-amber-950 rounded shrink-0">
                            {quest.icon || '🎯'}
                          </span>
                          
                          <div className="space-y-1 flex-1 min-w-0">
                            <h4 className={`font-pixel text-[10px] sm:text-xs truncate ${
                              quest.claimed ? 'text-gray-400 line-through' : 'text-amber-100 font-bold'
                            }`}>
                              {quest.title}
                            </h4>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[8px] font-pixel text-amber-300/80">
                                <span>Tiến độ:</span>
                                <span className="text-yellow-400 font-bold">{quest.progress} / {quest.target}</span>
                              </div>
                              <div className="w-full h-2 bg-black/60 rounded-full border border-amber-950 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 rounded-full ${
                                    quest.completed ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-yellow-500 to-amber-400'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>

                            {/* Rewards */}
                            <div className="flex items-center gap-2 pt-0.5 font-pixel text-[8px]">
                              <span className="text-amber-400/70">Thưởng:</span>
                              <span className="bg-amber-950/80 text-yellow-300 px-1.5 py-0.5 rounded border border-amber-800">
                                🪙 +{quest.rewardXu.toLocaleString()} Xu
                              </span>
                              {quest.rewardLuong && quest.rewardLuong > 0 ? (
                                <span className="bg-purple-950/80 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800 font-bold">
                                  💎 +{quest.rewardLuong} Lượng
                                </span>
                              ) : null}
                              <span className="bg-sky-950/80 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800">
                                ⭐ +{quest.rewardExp} EXP
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Claim Button */}
                        <div className="shrink-0 flex items-center justify-end">
                          {quest.claimed ? (
                            <span className="font-pixel text-[8px] text-emerald-400 px-2.5 py-1 bg-emerald-950/40 border border-emerald-800 rounded">
                              ĐÃ NHẬN
                            </span>
                          ) : quest.completed ? (
                            <button
                              onClick={() => handleClaimReward(quest)}
                              disabled={claimingId === quest.id}
                              className="pixel-btn bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-pixel text-[9px] sm:text-[10px] px-3.5 py-1.5 font-black shadow animate-pulse border border-white cursor-pointer"
                            >
                              NHẬN THƯỞNG
                            </button>
                          ) : (
                            <span className="font-pixel text-[8px] text-amber-400/60 px-2.5 py-1 bg-black/40 border border-amber-950 rounded">
                              CHƯA XONG
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#180d07] p-2.5 border-t border-amber-950 flex items-center justify-between text-amber-300/70 font-pixel text-[8px]">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>Mẹo: Hoàn thành nhiệm vụ giúp bạn lên cấp nhanh và mở khóa nhiều tính năng đặc sắc!</span>
          </div>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="pixel-btn bg-stone-800 hover:bg-stone-700 text-amber-200 px-3 py-1 text-[8px]"
          >
            ĐÓNG
          </button>
        </div>

      </div>
    </div>
  );
};
