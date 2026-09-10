import React, { useState } from 'react';
import { UserProfile } from '../types';
import { sounds } from '../utils/audio';
import { Sparkles, Key, ShieldAlert, LogIn, CheckCircle2, AlertCircle, Copy } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
  onShowMessage: (msg: string) => void;
}

const DEMO_KEYS = [
  { code: 'KEY-ADMIN-ROOT-9999', label: '🛡️ Master Admin (1M Xu / Quyền Admin)', role: 'admin' },
  { code: 'KEY-VIP-8888', label: '💎 Đại Gia VIP 8888 (200k Xu / 100 Lượng)', role: 'player' },
  { code: 'KEY-TEST-0001', label: '🌾 Nông Dân Thử Nghiệm 1 (50k Xu)', role: 'player' },
  { code: 'KEY-TEST-0002', label: '🎣 Cần Thủ Thử Nghiệm 2 (50k Xu)', role: 'player' },
];

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, onShowMessage }) => {
  const [keyCodeInput, setKeyCodeInput] = useState<string>('KEY-VIP-8888');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyCodeInput.trim()) {
      setErrorMessage('Vui lòng nhập mã Key của bạn.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    sounds.playClick();

    try {
      const response = await fetch('/api/auth/login-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyCode: keyCodeInput.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        sounds.playWin();
        localStorage.setItem('game_auth_token', data.token);
        localStorage.setItem('game_auth_key', keyCodeInput.trim().toUpperCase());
        onLoginSuccess(data.user, data.token);
        onShowMessage(`Đăng nhập thành công! Chào mừng ${data.user.nickname}`);
      } else {
        sounds.playClick();
        setErrorMessage(data.error || 'Mã Key không hợp lệ hoặc đã bị khóa.');
      }
    } catch {
      // Fallback nếu server chưa khởi chạy
      setErrorMessage('Không thể kết nối tới máy chủ VPS. Hãy chắc chắn Server đang chạy trên cổng 3000!');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuickKey = (code: string) => {
    sounds.playClick();
    setKeyCodeInput(code);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#12071a]/95 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-[#2a170e] border-4 border-[#ca8a04] w-full max-w-lg rounded-3xl shadow-[0_0_50px_rgba(202,138,4,0.3)] p-5 sm:p-7 my-auto text-white relative animate-fadeIn">
        
        {/* Retro Header Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black px-4 py-1.5 rounded-full text-xs font-black shadow-lg border-2 border-yellow-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>AVATAR MULTIPLAYER REALTIME</span>
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-200 mt-2 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            ĐĂNG NHẬP BẰNG KEY
          </h1>
          <p className="text-xs text-amber-300/80 mt-1">
            Mọi dữ liệu tài sản, cấp độ và đồ đạc được lưu thật 100% trong Database Server
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500 rounded-xl flex items-center gap-2.5 text-xs text-red-200 animate-bounce">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Nhập Key */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" /> Nhập Mã Key Của Bạn:
            </label>
            <input
              type="text"
              value={keyCodeInput}
              onChange={(e) => {
                setKeyCodeInput(e.target.value.toUpperCase());
                setErrorMessage(null);
              }}
              placeholder="VD: KEY-VIP-8888"
              className="w-full bg-[#1a0f08] border-2 border-[#ca8a04]/80 rounded-xl px-4 py-3 text-base font-mono font-bold text-yellow-300 placeholder-zinc-600 focus:outline-none focus:border-yellow-400 tracking-wider shadow-inner"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-black rounded-xl text-sm transition shadow-[0_4px_15px_rgba(202,138,4,0.4)] flex items-center justify-center gap-2 uppercase tracking-wide border-2 border-yellow-200"
          >
            {loading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" /> VÀO THÀNH PHỐ AVATAR
              </>
            )}
          </button>
        </form>

        {/* Danh Sách Key Mẫu Cho Phép Thử Nghiệm Nhanh */}
        <div className="mt-6 pt-5 border-t border-amber-900/50">
          <p className="text-[11px] font-bold text-amber-400 mb-2.5 flex items-center justify-between">
            <span>✨ CHỌN NHANH KEY MẪU ĐỂ TEST:</span>
            <span className="text-[10px] text-zinc-400 font-normal">(Click để điền)</span>
          </p>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_KEYS.map((k) => (
              <button
                key={k.code}
                type="button"
                onClick={() => handleSelectQuickKey(k.code)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition ${
                  keyCodeInput === k.code
                    ? 'bg-amber-500/20 border-yellow-400 text-yellow-200 shadow-md'
                    : 'bg-[#1e0e07] border-amber-950/80 text-zinc-300 hover:border-amber-700/60 hover:bg-[#25120a]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-300">{k.code}</span>
                  <span className="text-[11px] text-zinc-400">{k.label}</span>
                </div>
                {keyCodeInput === k.code ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <span className="text-[10px] text-amber-500/70 font-semibold">Chọn</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 text-center text-[10px] text-zinc-400 leading-relaxed">
          Tài khoản Admin có thể tạo thêm hàng loạt Key mới trong mục <strong>Admin Panel</strong> sau khi đăng nhập.
        </div>
      </div>
    </div>
  );
};
