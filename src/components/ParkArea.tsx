import React, { useState } from 'react';
import { UserProfile, ChatMessage } from '../types';
import { sounds } from '../utils/audio';
import { CharacterSprite } from './CharacterSprite';
import { 
  Send, 
  Smile, 
  Sparkles, 
  MessageSquare, 
  Heart, 
  Trees 
} from 'lucide-react';

interface ParkAreaProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onShowMessage: (msg: string) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: '1', senderName: 'NongDanSieuCap', text: 'Chao ca nha Avatar! Hom nay ho cau nhieu ca rong lam nha!', time: '10:05' },
  { id: '2', senderName: 'BeMeoDeThuong', text: 'Ai co hoa hong tang minh voi hihi 🌹', time: '10:07' },
  { id: '3', senderName: 'DaiGiaAvatar', text: 'Vua quay trung Canh Thien Than o song Bau Cua ne anh em!', time: '10:09' },
  { id: '4', senderName: 'CanThuVip99', text: 'Can Sen Ngoc keo ca ro dong suong tay that!', time: '10:12' },
];

const PARK_NPCS = [
  {
    name: 'Be Meo Xinh',
    level: 4,
    gender: 'female' as const,
    dialogue: 'Cong vien Avatar luc nao cung mat ruoi va nhon nhip!',
    appearance: {
      skinColor: '#fcd34d',
      hairStyle: 'long' as const,
      hairColor: '#f43f5e',
      shirtStyle: 'dress' as const,
      shirtColor: '#ec4899',
      pantsStyle: 'skirt' as const,
      pantsColor: '#db2777',
      hat: 'flower',
    },
  },
  {
    name: 'Cong Tu Bac Lieu',
    level: 8,
    gender: 'male' as const,
    dialogue: 'Ta vua mua duoc Can Hoang Kim 8000 Xu day!',
    appearance: {
      skinColor: '#fcd34d',
      hairStyle: 'spiky' as const,
      hairColor: '#eab308',
      shirtStyle: 'vest' as const,
      shirtColor: '#1e1b4b',
      pantsStyle: 'jeans' as const,
      pantsColor: '#312e81',
      hat: 'crown',
      wings: 'demon',
      glasses: 'black',
    },
  },
];

export const ParkArea: React.FC<ParkAreaProps> = ({
  user,
  onUpdateUser,
  onShowMessage,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [chatInput, setChatInput] = useState('');
  const [activeSpeech, setActiveSpeech] = useState<string | null>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    sounds.playClick();
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderName: user.nickname,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev.slice(-20), newMsg]);
    setActiveSpeech(chatInput.trim());
    setChatInput('');

    // Clear speech bubble after 6s
    setTimeout(() => {
      setActiveSpeech(null);
    }, 6000);
  };

  const handleSendHeart = () => {
    sounds.playWin();
    setActiveSpeech('❤️ Toi yeu thanh pho Avatar! ❤️');
    onShowMessage('Ban vua tha tim khap cong vien! Moi nguoi mim cuoi dap lai.');
    setTimeout(() => setActiveSpeech(null), 5000);
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] pb-24 pt-4 px-2 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Banner Header */}
        <div className="bg-[#121f11] pixel-box p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl filter drop-shadow">⛲</span>
            <div>
              <h1 className="text-base sm:text-lg font-black text-emerald-200 tracking-wide uppercase font-pixel flex items-center gap-2 pixel-shadow-sm">
                Cong Vien Pho Thi Avatar
              </h1>
              <p className="font-vt323 text-base text-emerald-300/80">
                Khu giao luu, tan bo hong gio, khoe trang phuc thoi trang va ket ban bon phuong!
              </p>
            </div>
          </div>

          <button
            onClick={handleSendHeart}
            className="pixel-btn bg-rose-600 hover:bg-rose-500 text-white font-pixel text-[10px] px-3 py-2 flex items-center gap-1.5"
          >
            <Heart className="w-3.5 h-3.5 fill-white" />
            <span>Tha Tim Pho</span>
          </button>
        </div>

        {/* The Park Plaza Canvas */}
        <div className="bg-[#162712] pixel-box p-4 sm:p-6 relative min-h-[360px] flex flex-col justify-between overflow-hidden">
          {/* Park Environment Props: Fountain in center, benches, trees */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-10 left-10 text-5xl">🌳</div>
            <div className="absolute top-12 right-12 text-5xl">🌲</div>
            <div className="absolute bottom-16 left-1/4 text-4xl">🪑</div>
            <div className="absolute bottom-16 right-1/4 text-4xl">🪑</div>
          </div>

          {/* Central Fountain Animation */}
          <div className="flex flex-col items-center justify-center my-4 relative z-10">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#0e273c] pixel-box-water flex flex-col items-center justify-center animate-pulse">
              <span className="text-3xl sm:text-4xl">⛲</span>
              <span className="font-pixel text-[7px] text-sky-200 uppercase mt-1">Dai Nuoc</span>
            </div>
          </div>

          {/* Characters in the Park (Player + NPCs) */}
          <div className="flex flex-wrap items-end justify-around gap-6 relative z-10 my-4">
            {/* NPC 1 */}
            <div
              onClick={() => {
                sounds.playClick();
                onShowMessage(`${PARK_NPCS[0].name}: "${PARK_NPCS[0].dialogue}"`);
              }}
              className="cursor-pointer hover:scale-105 transition-transform"
            >
              <CharacterSprite
                appearance={PARK_NPCS[0].appearance}
                nickname={PARK_NPCS[0].name}
                level={PARK_NPCS[0].level}
                scale={0.9}
                speechBubble="Chao mung ban den cong vien!"
              />
            </div>

            {/* Current Player Avatar */}
            <div className="scale-110">
              <CharacterSprite
                appearance={user.appearance}
                nickname={user.nickname}
                level={user.level}
                scale={1}
                speechBubble={activeSpeech}
              />
            </div>

            {/* NPC 2 */}
            <div
              onClick={() => {
                sounds.playClick();
                onShowMessage(`${PARK_NPCS[1].name}: "${PARK_NPCS[1].dialogue}"`);
              }}
              className="cursor-pointer hover:scale-105 transition-transform"
            >
              <CharacterSprite
                appearance={PARK_NPCS[1].appearance}
                nickname={PARK_NPCS[1].name}
                level={PARK_NPCS[1].level}
                scale={0.9}
                direction="left"
                speechBubble="Ai so ke Xu voi ta khong?"
              />
            </div>
          </div>

          {/* Park Chat Box at bottom */}
          <div className="bg-[#0b140a] pixel-box border-emerald-950 p-2.5 relative z-10">
            <div className="flex items-center gap-1.5 font-pixel text-[9px] text-emerald-400 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Kenh Chat Cong Vien:</span>
            </div>

            {/* Recent Messages Scrollable */}
            <div className="max-h-24 overflow-y-auto space-y-1 text-xs pr-1 mb-2 font-vt323 text-base">
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
                placeholder="Nhap tin nhan de hien bong chat tren dau..."
                className="flex-1 bg-[#121e10] border-2 border-emerald-900 px-2.5 py-1.5 font-vt323 text-base text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400"
                maxLength={80}
              />
              <button
                type="submit"
                className="pixel-btn bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 font-pixel text-[9px] flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>Gui</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
