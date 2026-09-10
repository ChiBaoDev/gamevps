import React from 'react';
import { UserProfile } from '../types';
import { sounds } from '../utils/audio';
import { 
  Coins, 
  Gem, 
  Volume2, 
  VolumeX, 
  Backpack, 
  Scroll, 
  Trophy, 
  Zap, 
  LogOut,
  Tv,
  ShieldAlert
} from 'lucide-react';

interface TopBarProps {
  user: UserProfile;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenInventory: () => void;
  onOpenQuests: () => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
  unclaimedQuestsCount: number;
  isScanlines?: boolean;
  onToggleScanlines?: () => void;
}


export const TopBar: React.FC<TopBarProps> = ({
  user,
  isMuted,
  onToggleMute,
  onOpenInventory,
  onOpenQuests,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenAdmin,
  onLogout,
  unclaimedQuestsCount,
  isScanlines = false,
  onToggleScanlines,
}) => {
  const expPercent = Math.min(100, Math.round((user.exp / user.maxExp) * 100));
  const energyPercent = Math.min(100, Math.round((user.energy / user.maxEnergy) * 100));


  return (
    <header className="sticky top-0 z-40 bg-[#221108] border-b-4 border-[#120703] shadow-2xl px-2 sm:px-4 py-2 text-white select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Avatar Mini & User info */}
        <div 
          onClick={() => { sounds.playClick(); onOpenProfile(); }}
          className="flex items-center gap-2 sm:gap-3 bg-[#33180c] hover:bg-[#422010] cursor-pointer p-1.5 sm:p-2 pixel-box transition-all"
        >
          {/* Mini Avatar Face */}
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-amber-300 to-amber-500 border-2 border-[#170a04] flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-xl sm:text-2xl">{user.gender === 'female' ? '👧' : '👦'}</span>
            <div className="absolute bottom-0 right-0 bg-red-600 text-white text-[8px] font-pixel px-1 border-t border-l border-black">
              {user.level}
            </div>
          </div>

          {/* Name & EXP & Energy bars */}
          <div className="flex flex-col min-w-[110px] sm:min-w-[140px]">
            <div className="flex items-center gap-1.5">
              <span className="font-pixel text-[11px] sm:text-xs text-amber-200 truncate max-w-[100px] sm:max-w-[130px] pixel-shadow-sm">
                {user.nickname}
              </span>
              <span className="bg-[#170a04] text-amber-400 text-[8px] font-pixel px-1 py-0.5 border border-amber-800">
                Lv.{user.level}
              </span>
            </div>

            {/* EXP Bar */}
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[8px] text-amber-400 font-pixel w-5">EXP</span>
              <div className="flex-1 h-2.5 pixel-progress-track relative overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-500 pixel-progress-fill transition-all duration-300"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
              <span className="text-[8px] text-gray-300 font-mono min-w-[28px] text-right">
                {user.exp}/{user.maxExp}
              </span>
            </div>

            {/* Energy Bar */}
            <div className="flex items-center gap-1 mt-0.5">
              <Zap className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" />
              <div className="flex-1 h-2.5 pixel-progress-track relative overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-600 via-sky-400 to-blue-500 pixel-progress-fill transition-all duration-300"
                  style={{ width: `${energyPercent}%` }}
                />
              </div>
              <span className="text-[8px] text-cyan-200 font-mono min-w-[28px] text-right">
                {user.energy}/{user.maxEnergy}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Currency Displays (Xu and Lượng) */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Xu (Coins) */}
          <div className="flex items-center gap-2 bg-[#120703] border-2 border-yellow-600/80 px-2.5 sm:px-3 py-1.5 pixel-box-gold">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse fill-yellow-500/40" />
            <div className="flex flex-col">
              <span className="text-[8px] text-yellow-500 font-pixel leading-none">XU</span>
              <span className="text-[11px] sm:text-xs font-pixel text-yellow-300 leading-tight mt-0.5">
                {user.xu.toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          {/* Luong (Gems) */}
          <div className="flex items-center gap-2 bg-[#120703] border-2 border-fuchsia-600/80 px-2.5 sm:px-3 py-1.5 pixel-box">
            <Gem className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400 fill-fuchsia-500/40" />
            <div className="flex flex-col">
              <span className="text-[8px] text-fuchsia-400 font-pixel leading-none">LUONG</span>
              <span className="text-[11px] sm:text-xs font-pixel text-fuchsia-200 leading-tight mt-0.5">
                {user.luong.toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Admin Panel button (Chỉ hiện khi role === 'admin') */}
          {user.role === 'admin' && onOpenAdmin && (
            <button
              onClick={() => { sounds.playClick(); onOpenAdmin(); }}
              className="pixel-btn bg-rose-800 hover:bg-rose-700 text-rose-100 px-2.5 py-1.5 flex items-center gap-1 font-pixel text-[9px] border-2 border-rose-400 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]"
              title="Mở Bảng Quản Trị Hệ Thống (Admin Dashboard)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
              <span className="hidden sm:inline font-bold">ADMIN</span>
            </button>
          )}

          {/* Daily Quests button */}
          <button

            onClick={() => { sounds.playClick(); onOpenQuests(); }}
            className="relative pixel-btn bg-amber-700 hover:bg-amber-600 text-amber-100 px-2.5 py-1.5 flex items-center gap-1 font-pixel text-[9px]"
            title="Nhiem Vu Hang Ngay"
          >
            <Scroll className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden md:inline">N.VU</span>
            {unclaimedQuestsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[8px] font-pixel flex items-center justify-center border border-black animate-bounce">
                {unclaimedQuestsCount}
              </span>
            )}
          </button>

          {/* Bag / Inventory button */}
          <button
            onClick={() => { sounds.playClick(); onOpenInventory(); }}
            className="pixel-btn bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-2.5 py-1.5 flex items-center gap-1 font-pixel text-[9px]"
            title="Ruong Do & Nong San"
          >
            <Backpack className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden md:inline">RUONG</span>
          </button>

          {/* Leaderboard button */}
          <button
            onClick={() => { sounds.playClick(); onOpenLeaderboard(); }}
            className="pixel-btn bg-yellow-800 hover:bg-yellow-700 text-yellow-100 px-2.5 py-1.5 flex items-center gap-1 font-pixel text-[9px]"
            title="Bang Xep Hang Dai Gia"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden md:inline">BXH</span>
          </button>

          {/* Scanlines CRT filter toggle */}
          {onToggleScanlines && (
            <button
              onClick={() => { sounds.playClick(); onToggleScanlines(); }}
              className={`pixel-btn px-2 py-1.5 text-[9px] font-pixel ${
                isScanlines ? 'bg-purple-800 text-purple-200' : 'bg-gray-800 text-gray-300'
              }`}
              title="Bat/Tat hieu ung man hinh CRT"
            >
              <Tv className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => { onToggleMute(); }}
            className={`pixel-btn px-2 py-1.5 text-[9px] font-pixel ${
              isMuted ? 'bg-red-950 text-red-300' : 'bg-blue-900 hover:bg-blue-800 text-blue-200'
            }`}
            title={isMuted ? "Bat am thanh" : "Tat am thanh"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Logout button */}
          <button
            onClick={() => { sounds.playClick(); onLogout(); }}
            className="pixel-btn bg-red-900/90 hover:bg-red-800 text-red-200 px-2 py-1.5 text-[9px]"
            title="Dang xuat / Doi nhan vat"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
