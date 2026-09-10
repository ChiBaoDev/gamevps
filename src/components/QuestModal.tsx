import React from 'react';
import { UserProfile, DailyQuest } from '../types';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Scroll, CheckCircle2, Coins, Sparkles, Trophy } from 'lucide-react';

interface QuestModalProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onClose: () => void;
  onShowMessage: (msg: string) => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({
  user,
  onUpdateUser,
  onClose,
  onShowMessage,
}) => {
  const handleClaimReward = (quest: DailyQuest) => {
    if (!quest.completed || quest.claimed) return;

    sounds.playWin();
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
    } catch {
      // Ignored
    }

    const updatedQuests = user.quests.map((q) => {
      if (q.id === quest.id) {
        return { ...q, claimed: true };
      }
      return q;
    });

    let newExp = user.exp + quest.rewardExp;
    let newLevel = user.level;
    let newMaxExp = user.maxExp;
    let newLuong = user.luong;

    if (newExp >= user.maxExp) {
      newLevel += 1;
      newExp -= user.maxExp;
      newMaxExp = Math.round(newMaxExp * 1.5);
      newLuong += 2;
      sounds.playLevelUp();
      onShowMessage(`🎉 LEN CAP ${newLevel}! Nhan them 2 LUONG.`);
    }

    onUpdateUser({
      xu: user.xu + quest.rewardXu,
      exp: newExp,
      level: newLevel,
      maxExp: newMaxExp,
      luong: newLuong,
      quests: updatedQuests,
    });

    onShowMessage(`🎁 Da nhan thuong ${quest.rewardXu} Xu va +${quest.rewardExp} EXP tu nhiem vu!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#24130a] pixel-box-gold w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#361a0b] p-3 border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl filter drop-shadow">📜</span>
            <div>
              <h2 className="font-black text-yellow-300 text-xs sm:text-sm font-pixel pixel-shadow-sm">
                Nhiem Vu Hang Ngay Avatar
              </h2>
              <p className="font-vt323 text-base text-amber-200/80">
                Hoan thanh chi tieu lam nong, cau ca de nhan Xu & EXP
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

        {/* Quests List */}
        <div className="p-3 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {user.quests.map((quest) => {
            const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100));

            return (
              <div
                key={quest.id}
                className={`p-2.5 pixel-plot flex items-center justify-between gap-2.5 ${
                  quest.claimed
                    ? 'opacity-60 bg-[#150a04]'
                    : quest.completed
                    ? 'bg-[#3b2713] border-yellow-400'
                    : 'bg-[#221008]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-1 bg-black/40 border border-black">{quest.icon}</span>
                  <div>
                    <h4 className="font-pixel text-[9px] text-amber-200">
                      {quest.title}
                    </h4>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 sm:w-28 h-2.5 pixel-progress-track relative overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 pixel-progress-fill"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="font-pixel text-[8px] text-amber-300">
                        {quest.progress}/{quest.target}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 font-pixel text-[8px] text-yellow-400">
                      <span>+{quest.rewardXu} Xu</span>
                      <span>+{quest.rewardExp} EXP</span>
                    </div>
                  </div>
                </div>

                {/* Claim button */}
                <div>
                  {quest.claimed ? (
                    <span className="font-pixel text-[8px] text-gray-400 block px-2 py-1 bg-black/40 border border-gray-700">
                      DA NHAN
                    </span>
                  ) : quest.completed ? (
                    <button
                      onClick={() => handleClaimReward(quest)}
                      className="pixel-btn bg-yellow-500 hover:bg-yellow-400 text-black font-pixel text-[9px] px-2.5 py-1.5 animate-pulse"
                    >
                      NHAN THUONG
                    </button>
                  ) : (
                    <span className="font-pixel text-[8px] text-amber-300/60 block px-2 py-1 bg-black/30 border border-amber-950">
                      CHUA XONG
                    </span>
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
