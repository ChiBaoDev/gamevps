import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ChatMessage, AvatarAppearance } from '../types';
import { ALL_HOUSES, ALL_VEHICLES } from '../utils/gameData';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { CharacterSprite } from './CharacterSprite';
import { 
  Send, 
  Sparkles, 
  MessageSquare, 
  Heart, 
  Users,
  Flame,
  Search,
  Trophy,
  Home,
  Compass,
  Zap,
  Gift
} from 'lucide-react';

interface ParkAreaProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onShowMessage: (msg: string) => void;
  onInspectPlayer?: (playerIdOrName: string, initialProfile?: any) => void;
}

interface ParkPlayer {
  id: string;
  nickname: string;
  level: number;
  role?: string;
  gender?: string;
  appearance: AvatarAppearance;
  vehicleId?: string;
  equippedHouseId?: string;
  houses?: string[];
  xu?: number;
  luong?: number;
  stats?: Record<string, number>;
  x: number;
  y: number;
  direction: 'left' | 'right';
  isMoving: boolean;
  speechBubble?: string | null;
  speechExpiresAt?: number;
}

export const ParkArea: React.FC<ParkAreaProps> = ({
  user,
  onUpdateUser,
  onShowMessage,
  onInspectPlayer,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', senderName: 'Hệ Thống', text: 'Chào mừng bạn đến với Công Viên Realtime! Click bất kỳ đâu trên mặt đất để di chuyển & giao lưu cùng mọi người ✨', time: 'Vừa xong' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [myPos, setMyPos] = useState<{ x: number; y: number; direction: 'left' | 'right'; isMoving: boolean }>({
    x: 450,
    y: 350,
    direction: 'right',
    isMoving: false,
  });
  const [otherPlayers, setOtherPlayers] = useState<Map<string, ParkPlayer>>(new Map());
  const [selectedPlayer, setSelectedPlayer] = useState<ParkPlayer | null>(null);
  const [isSittingBench, setIsSittingBench] = useState(false);
  const [fountainSplash, setFountainSplash] = useState(false);

  const plazaRef = useRef<HTMLDivElement>(null);
  const moveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect WebSocket for Realtime Park
  useEffect(() => {
    const token = localStorage.getItem('game_auth_token') || '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3000/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send PARK_JOIN to announce presence
      ws.send(JSON.stringify({
        type: 'PARK_JOIN',
        x: myPos.x,
        y: myPos.y,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'PARK_SYNC_ALL') {
          const map = new Map<string, ParkPlayer>();
          if (Array.isArray(data.players)) {
            data.players.forEach((p: ParkPlayer) => {
              if (p.id !== user.id) {
                map.set(p.id, p);
              }
            });
          }
          setOtherPlayers(map);
        }

        if (data.type === 'PARK_PLAYER_JOINED') {
          const p = data.player;
          if (p && p.id !== user.id) {
            setOtherPlayers((prev) => {
              const next = new Map(prev);
              next.set(p.id, p);
              return next;
            });
            onShowMessage(`👋 Người chơi [${p.nickname}] vừa bước vào Công Viên!`);
          }
        }

        if (data.type === 'PARK_PLAYER_MOVED') {
          if (data.userId && data.userId !== user.id) {
            setOtherPlayers((prev) => {
              const next = new Map(prev);
              const p = next.get(data.userId);
              if (p) {
                next.set(data.userId, {
                  ...p,
                  x: data.x,
                  y: data.y,
                  direction: data.direction,
                  isMoving: data.isMoving,
                });
              }
              return next;
            });
          }
        }

        if (data.type === 'PARK_CHAT_BROADCAST') {
          const newMsg: ChatMessage = {
            id: data.id || Date.now().toString(),
            senderName: data.senderName,
            text: data.text,
            time: data.time || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev.slice(-30), newMsg]);

          // Update speech bubble on other player
          if (data.senderId && data.senderId !== user.id) {
            setOtherPlayers((prev) => {
              const next = new Map(prev);
              const p = next.get(data.senderId);
              if (p) {
                next.set(data.senderId, {
                  ...p,
                  speechBubble: data.text,
                  speechExpiresAt: Date.now() + 7000,
                });
              }
              return next;
            });
          }
        }

        if (data.type === 'PARK_WISH_BROADCAST') {
          sounds.playWin();
          try {
            confetti({ particleCount: 35, spread: 60, origin: { y: 0.5 } });
          } catch {}
          onShowMessage(`⛲ ${data.senderName} vừa ném xu cầu may: ${data.prizeText}`);
        }

        if (data.type === 'PARK_EMOTE_BROADCAST') {
          sounds.playWin();
          try {
            confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
          } catch {}
          onShowMessage(`💖 ${data.senderName} vừa thả tim & bắn pháo hoa chào cả công viên!`);
        }

        if (data.type === 'PARK_PLAYER_LEFT') {
          setOtherPlayers((prev) => {
            const next = new Map(prev);
            next.delete(data.userId);
            return next;
          });
        }
      } catch {}
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'PARK_LEAVE' }));
      }
      ws.close();
    };
  }, [user.id]);

  // Handle clicking on the Park Plaza to walk/drive avatar
  const handlePlazaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!plazaRef.current) return;
    const rect = plazaRef.current.getBoundingClientRect();
    const clickX = Math.round(e.clientX - rect.left);
    const clickY = Math.round(e.clientY - rect.top);

    // Clamp coordinates to safe park area
    const targetX = Math.max(50, Math.min(rect.width - 60, clickX));
    const targetY = Math.max(80, Math.min(rect.height - 70, clickY));

    const newDirection = targetX < myPos.x ? 'left' : 'right';

    setIsSittingBench(false);
    sounds.playClick();

    // Start movement
    setMyPos((prev) => ({ ...prev, direction: newDirection, isMoving: true }));

    // Send move start to WS
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'PARK_MOVE',
        x: targetX,
        y: targetY,
        direction: newDirection,
        isMoving: true,
      }));
    }

    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);

    // Animate smoothly to target position
    setMyPos({
      x: targetX,
      y: targetY,
      direction: newDirection,
      isMoving: true,
    });

    moveTimerRef.current = setTimeout(() => {
      setMyPos((prev) => ({ ...prev, isMoving: false }));
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'PARK_MOVE',
          x: targetX,
          y: targetY,
          direction: newDirection,
          isMoving: false,
        }));
      }
    }, 600);
  };

  // Send Public Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    sounds.playClick();
    const text = chatInput.trim();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'PARK_CHAT',
        text,
      }));
    } else {
      // Local fallback
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        senderName: user.nickname,
        text,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev.slice(-30), newMsg]);
    }

    setChatInput('');
  };

  // Interact with Wishing Fountain (Ném 10 Xu)
  const handleWishFountain = async () => {
    if (user.xu < 10) {
      sounds.playError();
      onShowMessage('Bạn cần ít nhất 10 Xu để ném vào đài ước nguyện!');
      return;
    }

    setFountainSplash(true);
    setTimeout(() => setFountainSplash(false), 1200);

    const token = localStorage.getItem('game_auth_token');
    if (token) {
      try {
        const res = await fetch('/api/game/park/wish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success && data.user) {
          sounds.playWin();
          onUpdateUser(data.user);
          onShowMessage(data.message);
          return;
        }
      } catch {}
    }

    // Local fallback
    sounds.playWin();
    const roll = Math.floor(Math.random() * 100);
    let rewardText = '';
    let updatedXu = user.xu - 10;
    let updatedExp = user.exp;
    let updatedLuong = user.luong;

    if (roll < 40) {
      rewardText = 'Nhận được +10 EXP may mắn từ Thần Nước!';
      updatedExp += 10;
    } else if (roll < 75) {
      rewardText = 'Thần Nước trả lại 50 Xu tài lộc!';
      updatedXu += 50;
    } else if (roll < 95) {
      rewardText = '🎉 Đại Cát! Nhận được 1 LƯỢNG từ giếng ước!';
      updatedLuong += 1;
    } else {
      rewardText = '🌟 ĐẠI PHÚC ĐẠI QUÝ! Trúng 300 Xu từ Thần Long!';
      updatedXu += 300;
    }

    onUpdateUser({ xu: updatedXu, exp: updatedExp, luong: updatedLuong });
    onShowMessage(rewardText);
  };

  // Sit on Bench
  const handleSitBench = () => {
    sounds.playClick();
    setIsSittingBench(!isSittingBench);
    onShowMessage(isSittingBench ? 'Bạn đã đứng dậy khỏi ghế đá.' : 'Bạn đang ngồi thư giãn tại ghế đá công viên 🍵');
  };

  // Emote Fireworks
  const handleSendFirework = () => {
    sounds.playWin();
    try {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#38bdf8', '#facc15', '#a855f7'],
      });
    } catch {}

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'PARK_EMOTE',
        emote: 'heart_firework',
      }));
    }
  };

  // Helper to find vehicle name
  const getVehicleDef = (vehId?: string) => {
    return ALL_VEHICLES.find(v => v.id === vehId);
  };

  // Helper to find house name
  const getHouseDef = (houseId?: string) => {
    return ALL_HOUSES.find(h => h.id === houseId);
  };

  const totalPlayersCount = 1 + otherPlayers.size;

  return (
    <div className="relative min-h-[calc(100vh-140px)] pb-24 pt-4 px-2 sm:px-4 md:px-6 select-none">
      <div className="w-full max-w-7xl mx-auto space-y-3">
        
        {/* Banner Header */}
        <div className="bg-[#121f11] pixel-box p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg border-2 border-emerald-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl filter drop-shadow">⛲</span>
            <div>
              <h1 className="text-base sm:text-lg font-black text-emerald-200 tracking-wide uppercase font-pixel flex items-center gap-2 pixel-shadow-sm">
                CÔNG VIÊN TRUNG TÂM REALTIME
              </h1>
              <p className="font-vt323 text-base text-emerald-300/80">
                Quảng trường rộng lớn kết nối trực tiếp nhiều người chơi thật, khoe siêu xe & trang phục lộng lẫy!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-[#0a1409] px-3.5 py-1.5 rounded-lg border border-emerald-600/80 flex items-center gap-2 shadow-inner">
              <Users className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-pixel text-[9.5px] text-emerald-200 font-bold">
                Online: {totalPlayersCount} Người Chơi Thật
              </span>
            </div>

            <button
              onClick={handleSendFirework}
              className="pixel-btn bg-rose-600 hover:bg-rose-500 text-white font-pixel text-[10px] px-3.5 py-2 flex items-center gap-1.5 shadow-md"
            >
              <Heart className="w-3.5 h-3.5 fill-white animate-pulse" />
              <span>Thả Tim & Pháo Hoa</span>
            </button>
          </div>
        </div>

        {/* Realtime Park Plaza Area - Expanded Ultra Wide & High */}
        <div
          ref={plazaRef}
          onClick={handlePlazaClick}
          className="relative bg-[#163014] pixel-box border-emerald-950 min-h-[580px] sm:min-h-[640px] md:min-h-[700px] overflow-hidden cursor-crosshair shadow-2xl rounded-lg"
          style={{
            backgroundImage: `
              radial-gradient(#275222 18%, transparent 19%),
              radial-gradient(#11270f 18%, transparent 19%),
              linear-gradient(to bottom, rgba(20, 50, 18, 0.4), rgba(8, 22, 7, 0.8))
            `,
            backgroundSize: '36px 36px, 36px 36px, 100% 100%',
            backgroundPosition: '0 0, 18px 18px, 0 0',
          }}
        >
          {/* Stone Pathway Grid Pattern / Đường Lát Đá Công Viên */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 bg-amber-950/20 border-y border-amber-900/30 pointer-events-none" />
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-20 bg-amber-950/20 border-x border-amber-900/30 pointer-events-none" />

          {/* ========================================== */}
          {/* PARK DECORATIVE PROPS & SCENERY */}
          {/* ========================================== */}

          {/* Corner 1: Koi Pond & Water Lilies (Top-Left) */}
          <div className="absolute top-5 left-6 bg-[#0a273b]/70 p-3 rounded-2xl border-2 border-sky-600/50 flex flex-col items-center pointer-events-none shadow-md backdrop-blur-xs">
            <div className="text-3xl filter drop-shadow animate-pulse">🪷 🐠 🪷</div>
            <span className="font-pixel text-[7.5px] text-sky-300 mt-1">Hồ Hoa Sen & Cá Koi</span>
          </div>

          {/* Corner 2: Viewing Pavilion / Vọng Lâu Ngắm Cảnh (Top-Right) */}
          <div className="absolute top-5 right-6 bg-[#2a1309]/70 p-2.5 rounded-2xl border-2 border-amber-600/50 flex flex-col items-center pointer-events-none shadow-md backdrop-blur-xs">
            <div className="text-3xl filter drop-shadow">⛩️ 🏮</div>
            <span className="font-pixel text-[7.5px] text-amber-300 mt-1">Vọng Lâu Ngắm Cảnh</span>
          </div>

          {/* Corner 3: Picnic Garden (Bottom-Left) */}
          <div className="absolute bottom-6 left-8 bg-[#1e3318]/60 p-2.5 rounded-xl border border-emerald-600/40 flex items-center gap-2 pointer-events-none shadow-sm">
            <span className="text-3xl filter drop-shadow">🧺</span>
            <div className="text-xs">
              <span className="text-2xl">🌸 🌺 🌼</span>
            </div>
          </div>

          {/* Corner 4: Flower Lawn & Bicycle Rack (Bottom-Right) */}
          <div className="absolute bottom-6 right-8 bg-[#1e3318]/60 p-2.5 rounded-xl border border-emerald-600/40 flex items-center gap-2 pointer-events-none shadow-sm">
            <span className="text-3xl filter drop-shadow">🚲</span>
            <div className="text-xs">
              <span className="text-2xl">🌷 🌻 🌹</span>
            </div>
          </div>

          {/* Trees Border Lining */}
          <div className="absolute top-8 left-1/4 text-5xl pointer-events-none filter drop-shadow">🌳</div>
          <div className="absolute top-12 left-[38%] text-4xl pointer-events-none filter drop-shadow">🌲</div>
          <div className="absolute top-8 right-1/4 text-5xl pointer-events-none filter drop-shadow">🌳</div>
          <div className="absolute top-12 right-[38%] text-4xl pointer-events-none filter drop-shadow">🌲</div>
          <div className="absolute bottom-24 left-10 text-4xl pointer-events-none filter drop-shadow">🌴</div>
          <div className="absolute bottom-24 right-10 text-4xl pointer-events-none filter drop-shadow">🌴</div>

          {/* Street Lamps 🏮 with ambient light glow */}
          <div className="absolute top-1/3 left-16 text-3xl pointer-events-none filter drop-shadow">🏮</div>
          <div className="absolute top-1/3 right-16 text-3xl pointer-events-none filter drop-shadow">🏮</div>
          <div className="absolute bottom-1/3 left-16 text-3xl pointer-events-none filter drop-shadow">🏮</div>
          <div className="absolute bottom-1/3 right-16 text-3xl pointer-events-none filter drop-shadow">🏮</div>

          {/* Central Grand Wishing Fountain */}
          <div
            onClick={(e) => { e.stopPropagation(); handleWishFountain(); }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer flex flex-col items-center group"
          >
            <div className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#0a2540] border-4 border-[#38bdf8] flex flex-col items-center justify-center shadow-[0_0_35px_rgba(56,189,248,0.5)] transition-transform group-hover:scale-105 ${
              fountainSplash ? 'animate-bounce ring-4 ring-yellow-400' : ''
            }`}>
              <span className="text-4xl sm:text-5xl filter drop-shadow">⛲</span>
              <span className="font-pixel text-[8px] text-sky-200 uppercase mt-0.5 tracking-wider font-bold">
                Đài Ước Nguyện
              </span>
              <span className="font-vt323 text-sm text-yellow-300">
                Ném 10 Xu
              </span>
            </div>
          </div>

          {/* 4 Park Benches around the Plaza */}
          <div
            onClick={(e) => { e.stopPropagation(); handleSitBench(); }}
            className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer flex flex-col items-center group"
          >
            <span className="text-4xl filter drop-shadow group-hover:scale-110 transition-transform">🪑</span>
            <span className="font-pixel text-[7px] text-emerald-300 bg-black/60 px-1 rounded">Ghế Đá</span>
          </div>

          <div
            onClick={(e) => { e.stopPropagation(); handleSitBench(); }}
            className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer flex flex-col items-center group"
          >
            <span className="text-4xl filter drop-shadow group-hover:scale-110 transition-transform">🪑</span>
            <span className="font-pixel text-[7px] text-emerald-300 bg-black/60 px-1 rounded">Ghế Đá</span>
          </div>

          <div
            onClick={(e) => { e.stopPropagation(); handleSitBench(); }}
            className="absolute bottom-28 left-1/4 -translate-x-1/2 z-10 cursor-pointer flex flex-col items-center group"
          >
            <span className="text-4xl filter drop-shadow group-hover:scale-110 transition-transform">🪑</span>
            <span className="font-pixel text-[7px] text-emerald-300 bg-black/60 px-1 rounded">Ghế Đá</span>
          </div>

          <div
            onClick={(e) => { e.stopPropagation(); handleSitBench(); }}
            className="absolute bottom-28 right-1/4 translate-x-1/2 z-10 cursor-pointer flex flex-col items-center group"
          >
            <span className="text-4xl filter drop-shadow group-hover:scale-110 transition-transform">🪑</span>
            <span className="font-pixel text-[7px] text-emerald-300 bg-black/60 px-1 rounded">Ghế Đá</span>
          </div>

          {/* Instruction Tag on top */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-emerald-500/60 pointer-events-none z-20 shadow-md">
            <span className="font-pixel text-[8.5px] text-emerald-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
              <span>Chạm / Click vào mặt đất bất kỳ để di chuyển & khoe xe với người chơi thật!</span>
            </span>
          </div>

          {/* ========================================== */}
          {/* RENDER CURRENT PLAYER AVATAR */}
          {/* ========================================== */}
          <div
            className="absolute z-20 transition-all duration-500 ease-out cursor-pointer"
            style={{
              left: `${myPos.x}px`,
              top: `${myPos.y}px`,
              transform: 'translate(-50%, -70%)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              sounds.playClick();
              if (onInspectPlayer) {
                onInspectPlayer(user.id, user);
              } else {
                setSelectedPlayer({
                  id: user.id,
                  nickname: user.nickname,
                  level: user.level,
                  role: user.role,
                  appearance: user.appearance,
                  vehicleId: user.equippedVehicleId,
                  equippedHouseId: user.equippedHouseId,
                  houses: user.houses,
                  xu: user.xu,
                  luong: user.luong,
                  stats: user.stats,
                  x: myPos.x,
                  y: myPos.y,
                  direction: myPos.direction,
                  isMoving: myPos.isMoving,
                });
              }
            }}
          >
            {/* Crown tag for self */}
            <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-yellow-500 text-black font-pixel text-[7.5px] px-1.5 py-0.2 rounded-full border border-black shadow-md z-30">
              <span>👑 BẠN</span>
            </div>

            <CharacterSprite
              appearance={user.appearance}
              nickname={user.nickname}
              level={user.level}
              scale={1}
              isMoving={myPos.isMoving}
              direction={myPos.direction}
              vehicleId={user.equippedVehicleId}
              speechBubble={messages.length > 0 && messages[messages.length - 1].senderName === user.nickname ? messages[messages.length - 1].text : null}
            />
          </div>

          {/* ========================================== */}
          {/* RENDER OTHER CONNECTED REAL PLAYERS ONLY */}
          {/* ========================================== */}
          {Array.from(otherPlayers.values()).map((player) => (
            <div
              key={player.id}
              onClick={(e) => {
                e.stopPropagation();
                sounds.playClick();
                if (onInspectPlayer) {
                  onInspectPlayer(player.id || player.nickname, player);
                } else {
                  setSelectedPlayer(player);
                }
              }}
              className="absolute z-20 transition-all duration-500 ease-out cursor-pointer hover:scale-105"
              style={{
                left: `${player.x}px`,
                top: `${player.y}px`,
                transform: 'translate(-50%, -70%)',
              }}
            >
              <CharacterSprite
                appearance={player.appearance}
                nickname={player.nickname}
                level={player.level}
                scale={0.95}
                isMoving={player.isMoving}
                direction={player.direction}
                vehicleId={player.vehicleId}
                speechBubble={player.speechBubble}
              />
            </div>
          ))}
        </div>

        {/* Public Park Chat Bar */}
        <div className="bg-[#0b140a] pixel-box border-emerald-950 p-3 relative z-10 shadow-lg">
          <div className="flex items-center justify-between font-pixel text-[9px] text-emerald-400 mb-2">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>KÊNH CHAT CÔNG VIÊN THỜI GIAN THỰC (HIỆN BÓNG THOẠI TRÊN ĐẦU):</span>
            </div>
            <span className="font-vt323 text-sm text-gray-400">
              Nhấn vào tên để Soi Đồ
            </span>
          </div>

          {/* Recent Messages Scrollable */}
          <div className="max-h-28 overflow-y-auto space-y-1.5 text-xs pr-1 mb-3 font-vt323 text-base bg-[#060c05] p-2.5 rounded border border-emerald-950">
            {messages.map((m) => (
              <div key={m.id} className="flex items-start gap-1.5">
                <span className="text-gray-400 font-mono text-xs">[{m.time}]</span>
                <span 
                  onClick={() => {
                    sounds.playClick();
                    if (onInspectPlayer) onInspectPlayer(m.senderName);
                  }}
                  className="font-bold text-amber-300 hover:text-yellow-200 hover:underline cursor-pointer"
                  title="Nhấn để Soi Nhà Cửa & Kho Đồ"
                >
                  {m.senderName}:
                </span>
                <span className="text-gray-100 break-words">{m.text}</span>
              </div>
            ))}
          </div>

          {/* Input message form */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhập tin nhắn để hiện bóng chat trên đầu nhân vật..."
              className="flex-1 bg-[#121e10] border-2 border-emerald-900 px-3 py-2 font-vt323 text-base text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400"
              maxLength={80}
            />
            <button
              type="submit"
              className="pixel-btn bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 font-pixel text-[9.5px] flex items-center gap-1.5 shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL: PLAYER INSPECTION CARD (KHOE XE & SKIN) */}
      {/* ========================================== */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#1c0827] pixel-box-gold w-full max-w-md p-4 sm:p-5 relative text-center">
            {/* Close button */}
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-2.5 right-2.5 pixel-btn bg-red-900 hover:bg-red-800 text-white font-pixel text-[9px] px-2 py-0.5"
            >
              ✕
            </button>

            <span className="font-pixel text-[9px] text-yellow-400 uppercase tracking-widest block mb-2">
              HỒ SƠ CÔNG DÂN AVATAR
            </span>

            {/* Avatar Preview */}
            <div className="bg-[#100317] pixel-box p-4 my-2 flex flex-col items-center justify-center relative overflow-hidden">
              <CharacterSprite
                appearance={selectedPlayer.appearance}
                nickname={selectedPlayer.nickname}
                level={selectedPlayer.level}
                scale={1.3}
                vehicleId={selectedPlayer.vehicleId}
              />
            </div>

            {/* Player Details */}
            <h3 className="font-pixel text-sm text-yellow-300 mt-2 flex items-center justify-center gap-1.5">
              <span>{selectedPlayer.nickname}</span>
              {selectedPlayer.role === 'admin' && (
                <span className="bg-red-600 text-white text-[8px] px-1 py-0.5 rounded font-pixel">ADMIN</span>
              )}
            </h3>
            <span className="font-pixel text-[9px] text-purple-300">
              Cấp Độ: Lv.{selectedPlayer.level} | Giới tính: {selectedPlayer.gender === 'female' ? 'Nữ ♀️' : 'Nam ♂️'}
            </span>

            {/* Showcase: Vehicle & House */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-left">
              <div className="bg-[#14061d] p-2 pixel-box border-purple-900">
                <span className="font-pixel text-[8px] text-yellow-400 block mb-0.5">🏎️ XE ĐANG CƯỠI:</span>
                <span className="font-vt323 text-base text-white">
                  {getVehicleDef(selectedPlayer.vehicleId)?.name || 'Đi bộ'}
                </span>
              </div>

              <div className="bg-[#14061d] p-2 pixel-box border-purple-900">
                <span className="font-pixel text-[8px] text-yellow-400 block mb-0.5">🏰 BẤT ĐỘNG SẢN:</span>
                <span className="font-vt323 text-base text-white">
                  {getHouseDef(selectedPlayer.equippedHouseId)?.name || 'Nhà Tranh Mái Lá'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-2.5 mt-4">
              <button
                onClick={() => {
                  sounds.playWin();
                  onShowMessage(`❤️ Bạn đã thả tim cho ${selectedPlayer.nickname}!`);
                  setSelectedPlayer(null);
                }}
                className="pixel-btn bg-rose-600 hover:bg-rose-500 text-white font-pixel text-[9px] px-3 py-1.5 flex items-center gap-1 shadow"
              >
                <Heart className="w-3 h-3 fill-white" />
                <span>Thả Tim</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  onShowMessage(`👋 Bạn vừa vẫy tay chào ${selectedPlayer.nickname}!`);
                  setSelectedPlayer(null);
                }}
                className="pixel-btn bg-yellow-500 hover:bg-yellow-400 text-black font-pixel text-[9px] px-3 py-1.5 flex items-center gap-1 shadow"
              >
                <Sparkles className="w-3 h-3" />
                <span>Chào Hỏi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
