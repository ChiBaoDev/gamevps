import React from 'react';
import { AvatarAppearance } from '../types';

interface CharacterSpriteProps {
  appearance: AvatarAppearance;
  nickname?: string;
  level?: number;
  scale?: number;
  isMoving?: boolean;
  isFishing?: boolean;
  isWatering?: boolean;
  speechBubble?: string | null;
  direction?: 'left' | 'right';
  showNameTag?: boolean;
  vehicleId?: string;
}

export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  appearance,
  nickname,
  level,
  scale = 1,
  isMoving = false,
  isFishing = false,
  isWatering = false,
  speechBubble,
  direction = 'right',
  showNameTag = true,
  vehicleId,
}) => {
  const {
    skinColor = '#fcd34d',
    hairStyle = 'spiky',
    hairColor = '#451a03',
    shirtColor = '#2563eb',
    pantsColor = '#1e3a8a',
    hat,
    wings,
    glasses,
    handheld,
  } = appearance;

  return (
    <div
      className="relative flex flex-col items-center select-none"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'bottom center',
      }}
    >
      {/* Speech Bubble if speaking */}
      {speechBubble && (
        <div className="absolute -top-16 z-30 pointer-events-none animate-bounce">
          <div className="bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border-2 border-gray-800 max-w-[160px] text-center whitespace-normal break-words relative">
            {speechBubble}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-800" />
          </div>
        </div>
      )}

      {/* Name and Level Tag */}
      {showNameTag && nickname && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/85 px-2 py-0.5 rounded-full border border-amber-400/60 shadow-md whitespace-nowrap pointer-events-none max-w-[130px]">
          {level !== undefined && (
            <span className="bg-amber-500 text-black text-[8px] font-black px-1 py-0.2 rounded-sm shrink-0 leading-none">
              Lv.{level}
            </span>
          )}
          <span className="text-[10px] font-bold text-amber-200 tracking-wide truncate leading-none">
            {nickname}
          </span>
        </div>
      )}

      {/* Character Sprite Container */}
      <div
        className={`relative w-20 h-24 flex items-center justify-center transition-transform ${
          isMoving ? 'animate-bounce' : 'animate-avatar-idle'
        } ${direction === 'left' ? '-scale-x-100' : 'scale-x-100'}`}
      >
        {/* Back Wings */}
        {wings === 'angel' && (
          <div className="absolute top-4 -z-10 flex gap-6 text-2xl animate-pulse">
            <span className="-rotate-12 select-none filter drop-shadow">🪽</span>
            <span className="rotate-12 scale-x-[-1] select-none filter drop-shadow">🪽</span>
          </div>
        )}
        {wings === 'demon' && (
          <div className="absolute top-4 -z-10 flex gap-6 text-2xl animate-pulse">
            <span className="-rotate-12 select-none filter drop-shadow">🦇</span>
            <span className="rotate-12 scale-x-[-1] select-none filter drop-shadow">🦇</span>
          </div>
        )}

        {/* Character SVG Render */}
        <svg
          viewBox="0 0 80 96"
          className="w-20 h-24 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
          style={{ shapeRendering: 'crispEdges' }}
        >
          {/* Shadow beneath character */}
          <ellipse cx="40" cy="90" rx="18" ry="5" fill="rgba(0,0,0,0.3)" />

          {/* Legs & Shoes */}
          <rect x="28" y="74" width="8" height="14" fill={pantsColor} />
          <rect x="44" y="74" width="8" height="14" fill={pantsColor} />
          {/* Shoes */}
          <rect x="25" y="84" width="12" height="6" fill="#18181b" rx="2" />
          <rect x="43" y="84" width="12" height="6" fill="#18181b" rx="2" />

          {/* Torso / Clothes */}
          <rect x="26" y="48" width="28" height="28" fill={shirtColor} rx="3" />
          {/* Collar / Detail */}
          <polygon points="36,48 44,48 40,54" fill="#ffffff" />
          {/* Belt */}
          <rect x="26" y="71" width="28" height="4" fill="#78350f" />
          <rect x="38" y="71" width="4" height="4" fill="#facc15" />

          {/* Arms */}
          <rect x="18" y="50" width="8" height="20" fill={skinColor} rx="3" />
          <rect x="18" y="48" width="8" height="10" fill={shirtColor} rx="2" />
          <circle cx="22" cy="70" r="4" fill={skinColor} />

          {/* Right Arm (holds rod or tool) */}
          <rect x="54" y="50" width="8" height="20" fill={skinColor} rx="3" />
          <rect x="54" y="48" width="8" height="10" fill={shirtColor} rx="2" />
          <circle cx="58" cy="70" r="4" fill={skinColor} />

          {/* Head */}
          <rect x="23" y="16" width="34" height="34" fill={skinColor} rx="6" />

          {/* Hair Styles */}
          {hairStyle === 'spiky' && (
            <path
              d="M20,24 L22,12 L28,18 L34,8 L40,16 L48,8 L54,16 L60,12 L60,26 Z"
              fill={hairColor}
            />
          )}
          {hairStyle === 'short' && (
            <rect x="21" y="14" width="38" height="12" fill={hairColor} rx="4" />
          )}
          {hairStyle === 'long' && (
            <g>
              <rect x="21" y="14" width="38" height="12" fill={hairColor} rx="4" />
              <rect x="18" y="24" width="6" height="30" fill={hairColor} rx="3" />
              <rect x="56" y="24" width="6" height="30" fill={hairColor} rx="3" />
            </g>
          )}
          {hairStyle === 'bob' && (
            <g>
              <rect x="20" y="14" width="40" height="14" fill={hairColor} rx="6" />
              <rect x="18" y="24" width="8" height="20" fill={hairColor} rx="4" />
              <rect x="54" y="24" width="8" height="20" fill={hairColor} rx="4" />
            </g>
          )}

          {/* Cheeks Blush */}
          <circle cx="28" cy="38" r="3" fill="#f87171" opacity="0.6" />
          <circle cx="52" cy="38" r="3" fill="#f87171" opacity="0.6" />

          {/* Eyes (Anime pixel eyes) */}
          <rect x="30" y="28" width="5" height="7" fill="#1e1e1e" rx="1" />
          <rect x="31" y="29" width="2" height="2" fill="#ffffff" />
          <rect x="45" y="28" width="5" height="7" fill="#1e1e1e" rx="1" />
          <rect x="46" y="29" width="2" height="2" fill="#ffffff" />

          {/* Smile / Mouth */}
          <path d="M37,41 Q40,44 43,41" stroke="#92400e" strokeWidth="1.5" fill="none" />

          {/* Glasses */}
          {glasses === 'black' && (
            <g>
              <rect x="27" y="27" width="10" height="8" fill="#111827" rx="1" />
              <rect x="43" y="27" width="10" height="8" fill="#111827" rx="1" />
              <rect x="37" y="30" width="6" height="2" fill="#111827" />
              <rect x="29" y="29" width="4" height="2" fill="#4b5563" />
            </g>
          )}

          {/* Hats */}
          {hat === 'straw' && (
            <g>
              {/* Nón lá Việt Nam */}
              <polygon points="12,18 68,18 40,0" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
              <line x1="26" y1="18" x2="40" y2="28" stroke="#ca8a04" strokeWidth="1" />
              <line x1="54" y1="18" x2="40" y2="28" stroke="#ca8a04" strokeWidth="1" />
            </g>
          )}
          {hat === 'cowboy' && (
            <g>
              <ellipse cx="40" cy="16" rx="28" ry="6" fill="#78350f" />
              <rect x="26" y="4" width="28" height="12" fill="#92400e" rx="3" />
              <rect x="26" y="13" width="28" height="3" fill="#f59e0b" />
            </g>
          )}
          {hat === 'crown' && (
            <polygon points="26,14 26,4 33,10 40,2 47,10 54,4 54,14" fill="#eab308" stroke="#a16207" strokeWidth="1" />
          )}

          {/* Handheld Fishing Rod or Action */}
          {(isFishing || handheld?.startsWith('rod_')) && (
            <g className={isFishing ? 'animate-pulse' : ''}>
              {/* Bamboo rod angled */}
              <line x1="60" y1="68" x2="82" y2="24" stroke="#a16207" strokeWidth="3" strokeLinecap="round" />
              <line x1="60" y1="68" x2="82" y2="24" stroke="#eab308" strokeWidth="1" strokeDasharray="3,3" />
              {/* Fishing line dangling */}
              <line x1="82" y1="24" x2="80" y2="78" stroke="#cbd5e1" strokeWidth="1" />
              {/* Bobber float */}
              <circle cx="80" cy="78" r="3" fill="#ef4444" />
              <circle cx="80" cy="76" r="2" fill="#ffffff" />
            </g>
          )}

          {isWatering && (
            <g>
              {/* Watering can */}
              <rect x="58" y="60" width="12" height="10" fill="#38bdf8" rx="2" />
              <line x1="70" y1="62" x2="78" y2="56" stroke="#0284c7" strokeWidth="2" />
              <circle cx="79" cy="62" r="1.5" fill="#38bdf8" />
              <circle cx="81" cy="66" r="1.5" fill="#38bdf8" />
              <circle cx="83" cy="70" r="1.5" fill="#38bdf8" />
            </g>
          )}

          {/* Vehicle / Mount Overlays */}
          {vehicleId === 'veh_bicycle' && (
            <g>
              {/* Wheels */}
              <circle cx="20" cy="86" r="8" fill="none" stroke="#64748b" strokeWidth="2" />
              <circle cx="60" cy="86" r="8" fill="none" stroke="#64748b" strokeWidth="2" />
              <line x1="20" y1="86" x2="40" y2="76" stroke="#0284c7" strokeWidth="2.5" />
              <line x1="60" y1="86" x2="40" y2="76" stroke="#0284c7" strokeWidth="2.5" />
              <line x1="40" y1="76" x2="40" y2="68" stroke="#0284c7" strokeWidth="2" />
              {/* Handlebar */}
              <line x1="56" y1="64" x2="64" y2="64" stroke="#e2e8f0" strokeWidth="2.5" />
            </g>
          )}

          {vehicleId === 'veh_cub50' && (
            <g>
              {/* Cub 50cc chassis */}
              <circle cx="18" cy="86" r="7" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="62" cy="86" r="7" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
              <path d="M16,84 L36,80 L52,72 L64,74 L62,86 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
              <rect x="58" y="66" width="6" height="5" fill="#fef08a" />
              {isMoving && <text x="6" y="85" fontSize="10" className="animate-pulse">💨</text>}
            </g>
          )}

          {vehicleId === 'veh_sh' && (
            <g>
              {/* Vespa / SH chassis */}
              <circle cx="16" cy="86" r="8" fill="#0f172a" stroke="#e2e8f0" strokeWidth="2" />
              <circle cx="64" cy="86" r="8" fill="#0f172a" stroke="#e2e8f0" strokeWidth="2" />
              <path d="M14,84 L32,76 L54,68 L68,72 L66,86 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
              <circle cx="66" cy="68" r="4" fill="#fef08a" />
              {isMoving && <text x="4" y="86" fontSize="11" className="animate-pulse">💨</text>}
            </g>
          )}

          {vehicleId === 'veh_supercar' && (
            <g>
              {/* Lambo pixel sports car */}
              <rect x="6" y="74" width="68" height="14" fill="#e11d48" rx="3" stroke="#881337" strokeWidth="1.5" />
              <polygon points="20,74 32,62 58,62 66,74" fill="#38bdf8" opacity="0.8" />
              <circle cx="20" cy="88" r="6" fill="#0f172a" stroke="#facc15" strokeWidth="2" />
              <circle cx="60" cy="88" r="6" fill="#0f172a" stroke="#facc15" strokeWidth="2" />
              {isMoving && <rect x="2" y="84" width="12" height="4" fill="#f59e0b" className="animate-ping" />}
            </g>
          )}

          {vehicleId === 'veh_ufo' && (
            <g className="animate-pulse">
              {/* Alien UFO */}
              <ellipse cx="40" cy="82" rx="36" ry="10" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
              <ellipse cx="40" cy="78" rx="20" ry="8" fill="#06b6d4" opacity="0.7" />
              <circle cx="20" cy="84" r="2.5" fill="#22c55e" />
              <circle cx="40" cy="86" r="2.5" fill="#facc15" />
              <circle cx="60" cy="84" r="2.5" fill="#22c55e" />
            </g>
          )}

          {vehicleId === 'veh_pegasus' && (
            <g>
              {/* Golden Dragon / Pegasus mount */}
              <ellipse cx="40" cy="80" rx="24" ry="12" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
              <text x="56" y="80" fontSize="16" className="filter drop-shadow">🐉</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
