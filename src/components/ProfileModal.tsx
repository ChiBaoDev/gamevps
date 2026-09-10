import React, { useState } from 'react';
import { UserProfile, AvatarAppearance } from '../types';
import { sounds } from '../utils/audio';
import { CharacterSprite } from './CharacterSprite';
import { User, Sparkles, TrendingUp, Fish, Sprout, Coins, X } from 'lucide-react';

interface ProfileModalProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onClose: () => void;
  onShowMessage: (msg: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  onUpdateUser,
  onClose,
  onShowMessage,
}) => {
  const [nickname, setNickname] = useState(user.nickname);
  const [appearance, setAppearance] = useState<AvatarAppearance>({ ...user.appearance });

  const handleSave = () => {
    sounds.playCoin();
    onUpdateUser({
      nickname: nickname.trim() || user.nickname,
      appearance,
    });
    onShowMessage('Da cap nhat ho so & trang phuc nhan vat Avatar!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-[#2a170e] border-4 border-[#92400e] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#3e2416] p-4 border-b-2 border-amber-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👤</span>
            <div>
              <h2 className="font-black text-amber-200 text-base sm:text-lg font-pixel">
                Ho So Cu Dan Avatar
              </h2>
              <p className="text-xs text-amber-300/80">
                Tuy chinh dien mao, danh hieu va xem thanh tich
              </p>
            </div>
          </div>

          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="text-amber-300 hover:text-white font-black text-base bg-amber-950 px-3 py-1 rounded-xl border border-amber-800"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Avatar Preview & Name Input */}
          <div className="flex items-center gap-4 bg-[#1e0f08] p-4 rounded-2xl border border-amber-900/60">
            <div className="w-32 h-36 bg-black/40 border border-amber-800 rounded-2xl flex items-end justify-center pb-2 pt-5 shrink-0">
              <CharacterSprite appearance={appearance} nickname={nickname} level={user.level} scale={0.9} />
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <label className="text-xs text-amber-300 font-bold block mb-1">
                  Ten cu dan Avatar:
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-black/50 border border-amber-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400"
                  maxLength={16}
                />
              </div>

              <div className="text-xs text-amber-200 space-y-1 font-mono">
                <div>Cap do: <span className="text-yellow-400 font-bold">Cap {user.level}</span></div>
                <div>Kinh nghiem: <span className="text-amber-300 font-bold">{user.exp}/{user.maxExp} EXP</span></div>
              </div>
            </div>
          </div>

          {/* Player Statistics */}
          <div className="bg-[#1e0f08] p-3 sm:p-4 rounded-2xl border border-amber-900/60">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Thong Ke Thanh Tich</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-black/30 p-2 rounded-xl border border-amber-900/40">
                <span className="text-[10px] text-amber-400/80 block">Hoa mau da gat:</span>
                <span className="font-extrabold text-yellow-400 font-mono text-sm">
                  {user.stats.cropsHarvested} cay
                </span>
              </div>

              <div className="bg-black/30 p-2 rounded-xl border border-amber-900/40">
                <span className="text-[10px] text-amber-400/80 block">Ca da cau:</span>
                <span className="font-extrabold text-sky-400 font-mono text-sm">
                  {user.stats.fishCaught} con
                </span>
              </div>

              <div className="bg-black/30 p-2 rounded-xl border border-amber-900/40">
                <span className="text-[10px] text-amber-400/80 block">Thang mini-game:</span>
                <span className="font-extrabold text-purple-400 font-mono text-sm">
                  {user.stats.miniGamesWon} van
                </span>
              </div>
            </div>
          </div>

          {/* Quick Hair/Outfit Toggles */}
          <div className="bg-[#1e0f08] p-3 rounded-2xl border border-amber-900/60 space-y-2">
            <span className="text-[11px] font-bold text-amber-300 block">
              Trang phuc & Phu kien:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAppearance((p) => ({ ...p, hat: p.hat ? undefined : 'straw' }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  appearance.hat ? 'bg-amber-600 text-white border-yellow-400' : 'bg-black/40 text-gray-400 border-amber-950'
                }`}
              >
                👒 {appearance.hat ? 'Thao Non' : 'Doi Non La'}
              </button>

              <button
                type="button"
                onClick={() => setAppearance((p) => ({ ...p, glasses: p.glasses ? undefined : 'black' }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  appearance.glasses ? 'bg-amber-600 text-white border-yellow-400' : 'bg-black/40 text-gray-400 border-amber-950'
                }`}
              >
                🕶️ {appearance.glasses ? 'Thao Kinh' : 'Deo Kinh Ram'}
              </button>

              <button
                type="button"
                onClick={() => setAppearance((p) => ({ ...p, wings: p.wings ? undefined : 'angel' }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  appearance.wings ? 'bg-amber-600 text-white border-yellow-400' : 'bg-black/40 text-gray-400 border-amber-950'
                }`}
              >
                🪽 {appearance.wings ? 'Thao Canh' : 'Deo Canh Thien Than'}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="pixel-btn bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm py-2.5 rounded-2xl w-full"
          >
            LUU THAY DOI
          </button>
        </div>
      </div>
    </div>
  );
};
