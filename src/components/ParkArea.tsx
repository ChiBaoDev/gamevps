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

const RESIDENT_BOTS: ParkPlayer[] = [
  {
    id: 'bot_cat_girl',
    nickname: 'Bé Mèo Dễ Thương',
    level: 6,
    role: 'player',
    appearance: {
      skinColor: '#fcd34d',
      hairStyle: 'long',
      hairColor: '#f43f5e',
      shirtStyle: 'dress',
      shirtColor: '#ec4899',
      pantsStyle: 'skirt',
      pantsColor: '#db2777',
      hat: 'straw',
      wings: 'fairy' as any,
    },
    vehicleId: 'veh_sh',
    x: 180,
    y: 180,
    direction: 'right',
    isMoving: false,
    speechBubble: 'Công viên Avatar lúc nào cũng vui vẻ mát rượi! 🌸',
    speechExpiresAt: Date.now() + 999999,
  },
  {
    id: 'bot_rich_boy',
    nickname: 'Công Tử Bạc Liêu',
    level: 12,
    role: 'admin',
    appearance: {
      skinColor: '#fcd34d',
      hairStyle: 'spiky',
      hairColor: '#eab308',
      shirtStyle: 'vest',
      shirtColor: '#1e1b4b',
      pantsStyle: 'jeans',
      pantsColor: '#312e81',
      hat: 'crown',
      wings: 'demon',
      glasses: 'black',
    },
    vehicleId: 'veh_supercar',
    x: 580,
    y: 220,
    direction: 'left',
    isMoving: false,
    speechBubble: 'Ta vừa dạo phố bằng Siêu Xe Lambo xong! 🏎️',
    speechExpiresAt: Date.now() + 999999,
  },
];

export const ParkArea: React.FC<ParkAreaProps> = ({
  user,
  onUpdateUser,
  onShowMessage,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', senderName: 'Bé Mèo Dễ Thương', text: 'Chào mừng cả nhà đến với Công Viên Avatar! ✨', time: 'Vừa xong' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [myPos, setMyPos] = useState<{ x: number; y: number; direction: 'left' | 'right'; isMoving: boolean }>({
    x: 380,
    y: 280,
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
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send PARK_JOIN
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
          data.players.forEach((p: ParkPlayer) => {
            if (p.id !== user.id) map.set(p.id, p);
          });
          setOtherPlayers(map);
        }

        if (data.type === 'PARK_PLAYER_JOINED') {
          if (data.player.id !== user.id) {
            setOtherPlayers((prev) => {
              const next = new Map(prev);
              next.set(data.player.id, data.player);
              return next;
            });
          }
        }

        if (data.type === 'PARK_PLAYER_MOVED') {
          if (data.userId !== user.id) {
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

  // Toss Coin into Wishing Fountain
  const handleWishFountain = async () => {
    if (user.xu < 10) {
      onShowMessage('❌ Bạn cần ít nhất 10 Xu để ném xu ước nguyện!');
      return;
    }

    sounds.playCoin();
    setFountainSplash(true);
    setTimeout(() => setFountainSplash(false), 1200);

    try {
      const token = localStorage.getItem('game_auth_token') || '';
      const res = await fetch('/api/game/park/wish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        onUpdateUser(data.user);
        onShowMessage(`⛲ ${data.message}`);
      }
    } catch {
      onUpdateUser({ xu: user.xu - 10, exp: user.exp + 10 });
      onShowMessage('⛲ Bạn vừa ném 10 Xu vào đài phun nước cầu may mắn! (+10 EXP)');
    }
  };

  // Sit on Park Bench (Recovers energy)
  const handleSitBench = () => {
    sounds.playClick();
    setIsSittingBench(true);
    setMyPos({ x: 220, y: 310, direction: 'right', isMoving: false });
    onUpdateUser({ energy: Math.min(user.maxEnergy, user.energy + 5) });
    onShowMessage('🪑 Bạn đang ngồi nghỉ ngơi trên ghế đá công viên! Hồi phục +5 Năng lượng.');
  };

  // Send Fireworks / Hearts across the park
  const handleSendFirework = () => {
    sounds.playWin();
    try {
      confetti({ particleCount: 70, spread: 100, origin: { y: 0.5 } });
    } catch {}

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'PARK_EMOTE',
        emote: 'heart',
      }));
    } else {
      onShowMessage('💖 Bạn vừa bắn pháo hoa & thả tim rực rỡ khắp công viên!');
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

  const totalPlayersCount = 1 + otherPlayers.size + RESIDENT_BOTS.length;

  return (
    <div className="relative min-h-[calc(100vh-140px)] pb-24 pt-4 px-2 sm:px-6 select-none">
      <div className="max-w-5xl mx-auto">
        {/* Banner Header */}
        <div className="bg-[#121f11] pixel-box p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl filter drop-shadow">⛲</span>
            <div>
              <h1 className="text-base sm:text-lg font-black text-emerald-200 tracking-wide uppercase font-pixel flex items-center gap-2 pixel-shadow-sm">
                Công Viên Phố Thị Realtime
              </h1>
              <p className="font-vt323 text-base text-emerald-300/80">
                Nơi gặp gỡ nhiều người chơi thật, khoe xe & trang phục, dạo mát và giao lưu kết bạn!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#0a1409] px-3 py-1.5 rounded border border-emerald-700 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-pixel text-[9px] text-emerald-200">
                Đang có mặt: {totalPlayersCount} Cư Dân
              </span>
            </div>

            <button
              onClick={handleSendFirework}
              className="pixel-btn bg-rose-600 hover:bg-rose-500 text-white font-pixel text-[10px] px-3 py-2 flex items-center gap-1.5 shadow"
            >
              <Heart className="w-3.5 h-3.5 fill-white animate-pulse" />
              <span>Thả Tim & Pháo Hoa</span>
            </button>
          </div>
        </div>

        {/* Realtime Park Plaza Area */}
        <div
          ref={plazaRef}
          onClick={handlePlazaClick}
          className="relative bg-[#1a3818] pixel-box border-emerald-950 min-h-[440px] sm:min-h-[480px] overflow-hidden cursor-crosshair shadow-2xl mb-4"
          style={{
            backgroundImage: 'radial-gradient(#2d5a27 15%, transparent 16%), radial-gradient(#153013 15%, transparent 16%)',
            backgroundSize: '32px 32px',
            backgroundPosition: '0 0, 16px 16px',
          }}
        >
          {/* Park Decorative Props */}
          {/* Trees */}
          <div className="absolute top-4 left-6 text-5xl pointer-events-none filter drop-shadow">🌳</div>
          <div className="absolute top-6 left-28 text-4xl pointer-events-none filter drop-shadow">🌲</div>
          <div className="absolute top-4 right-8 text-5xl pointer-events-none filter drop-shadow">🌳</div>
          <div className="absolute top-8 right-32 text-4xl pointer-events-none filter drop-shadow">🌲</div>
          <div className="absolute bottom-6 left-8 text-4xl pointer-events-none filter drop-shadow">🌸</div>
          <div className="absolute bottom-6 right-8 text-4xl pointer-events-none filter drop-shadow">🌺</div>

          {/* Central Wishing Fountain */}
          <div
            onClick={(e) => { e.stopPropagation(); handleWishFountain(); }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer flex flex-col items-center group"
          >
            <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#0a2540] border-4 border-[#38bdf8] flex flex-col items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.4)] transition-transform group-hover:scale-105 ${
              fountainSplash ? 'animate-bounce ring-4 ring-yellow-400' : ''
            }`}>
              <span className="text-4xl sm:text-5xl filter drop-shadow">⛲</span>
              <span className="font-pixel text-[7.5px] text-sky-200 uppercase mt-0.5 tracking-wider">
                Đài Ước Nguyện
              </span>
              <span className="font-vt323 text-xs text-yellow-300">
                Ném 10 Xu
              </span>
            </div>
          </div>

          {/* Park Benches */}
          <div
            onClick={(e) => { e.stopPropagation(); handleSitBench(); }}
            className="absolute bottom-20 left-1/4 z-10 cursor-pointer flex flex-col items-center group"
          >
            <span className="text-4xl filter drop-shadow group-hover:scale-110 transition-transform">🪑</span>
            <span className="font-pixel text-[7px] text-emerald-300 bg-black/60 px-1 rounded">Ghế Đá</span>
          </div>

          <div
            onClick={(e) => { e.stopPropagation(); handleSitBench(); }}
            className="absolute bottom-20 right-1/4 z-10 cursor-pointer flex flex-col items-center group"
          >
            <span className="text-4xl filter drop-shadow group-hover:scale-110 transition-transform">🪑</span>
            <span className="font-pixel text-[7px] text-emerald-300 bg-black/60 px-1 rounded">Ghế Đá</span>
          </div>

          {/* Instruction Tag on top */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-xs px-3 py-1 rounded-full border border-emerald-500/60 pointer-events-none z-20">
            <span className="font-pixel text-[8.5px] text-emerald-300 flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-yellow-400 animate-spin" />
              <span>Chạm / Click vào mặt đất để di chuyển & khoe xe!</span>
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
          {/* RENDER OTHER CONNECTED PLAYERS */}
          {/* ========================================== */}
          {Array.from(otherPlayers.values()).map((player) => (
            <div
              key={player.id}
              onClick={(e) => { e.stopPropagation(); setSelectedPlayer(player); }}
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

          {/* ========================================== */}
          {/* RENDER RESIDENT BOTS */}
          {/* ========================================== */}
          {RESIDENT_BOTS.map((bot) => (
            <div
              key={bot.id}
              onClick={(e) => { e.stopPropagation(); setSelectedPlayer(bot); }}
              className="absolute z-20 cursor-pointer hover:scale-105 transition-transform"
              style={{
                left: `${bot.x}px`,
                top: `${bot.y}px`,
                transform: 'translate(-50%, -70%)',
              }}
            >
              <CharacterSprite
                appearance={bot.appearance}
                nickname={bot.nickname}
                level={bot.level}
                scale={0.95}
                direction={bot.direction}
                vehicleId={bot.vehicleId}
                speechBubble={bot.speechBubble}
              />
            </div>
          ))}
        </div>

        {/* Public Park Chat Bar */}
        <div className="bg-[#0b140a] pixel-box border-emerald-950 p-3 relative z-10">
          <div className="flex items-center justify-between font-pixel text-[9px] text-emerald-400 mb-2">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>KÊNH CHAT CÔNG VIÊN THỜI GIAN THỰC (HIỆN BÓNG THOẠI TRÊN ĐẦU):</span>
            </div>
            <span className="font-vt323 text-sm text-gray-400">
              Tất cả mọi người đều nhìn thấy
            </span>
          </div>

          {/* Recent Messages Scrollable */}
          <div className="max-h-28 overflow-y-auto space-y-1.5 text-xs pr-1 mb-3 font-vt323 text-base bg-[#060c05] p-2.5 rounded border border-emerald-950">
            {messages.map((m) => (
              <div key={m.id} className="flex items-start gap-1.5">
                <span className="text-gray-400 font-mono text-xs">[{m.time}]</span>
                <span className="font-bold text-amber-300">{m.senderName}:</span>
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
