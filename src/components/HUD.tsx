import React from 'react';
import { Volume2, VolumeX, Pause, Play, Palette, Shield, Zap, Flame, Trophy } from 'lucide-react';

interface HUDProps {
  score: number;
  highScore: number;
  combo: number;
  shield: boolean;
  energyTime: number;
  rageTime: number;
  isMuted: boolean;
  isPaused: boolean;
  memeText: string | null;
  gameState: 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';
  onToggleMute: () => void;
  onTogglePause: () => void;
  onOpenCustomizer: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  highScore,
  combo,
  shield,
  energyTime,
  rageTime,
  isMuted,
  isPaused,
  memeText,
  gameState,
  onToggleMute,
  onTogglePause,
  onOpenCustomizer,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
      {/* Top Bar: High Score, Top Right Controls */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* High Score Badge */}
        <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-700/60 shadow-lg text-amber-400 font-bold text-xs tracking-wider">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>BEST: {highScore}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Customizer / Skin Button */}
          <button
            onClick={onOpenCustomizer}
            title="Customize Character & Sounds"
            className="w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 flex items-center justify-center text-zinc-200 hover:text-amber-400 hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <Palette className="w-5 h-5" />
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 flex items-center justify-center text-zinc-200 hover:text-amber-400 hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-green-400" />}
          </button>

          {/* Pause Toggle (Only active when playing) */}
          {gameState === 'PLAYING' || gameState === 'PAUSED' ? (
            <button
              onClick={onTogglePause}
              title={isPaused ? 'Resume Game' : 'Pause Game'}
              className="w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 flex items-center justify-center text-zinc-200 hover:text-amber-400 hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              {isPaused ? <Play className="w-5 h-5 text-amber-400 fill-amber-400" /> : <Pause className="w-5 h-5" />}
            </button>
          ) : null}
        </div>
      </div>

      {/* Center: Live Score Display & Meme Alerts */}
      <div className="flex flex-col items-center">
        {/* Main Score (PUBG Bold Style) */}
        <div className="font-['Black_Ops_One',sans-serif] text-6xl text-amber-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] tracking-widest select-none">
          {score}
        </div>

        {/* Combo Multiplier Alert */}
        {combo > 1 && (
          <div className="animate-bounce mt-1 px-3 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 text-zinc-950 font-black text-sm tracking-wider shadow-md">
            MASS COMBO x{combo}!
          </div>
        )}

        {/* Active Meme Popup Banner */}
        {memeText && (
          <div className="mt-3 animate-pulse bg-red-600/90 text-white font-black text-xs uppercase px-4 py-1.5 rounded-full border border-amber-400 shadow-xl tracking-wider">
            💥 {memeText}
          </div>
        )}
      </div>

      {/* Bottom Bar: Active Power-ups HUD */}
      <div className="flex items-center justify-center gap-3 pb-2">
        {/* Level 3 Helmet Shield Indicator */}
        {shield && (
          <div className="flex items-center gap-1.5 bg-sky-950/80 border border-sky-400/70 text-sky-300 px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg backdrop-blur-sm">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>LV3 HELMET</span>
          </div>
        )}

        {/* Energy Drink Boost Indicator */}
        {energyTime > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-400/70 text-amber-300 px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
            <Zap className="w-4 h-4 text-amber-400 animate-spin" />
            <span>2X BOOST ({energyTime.toFixed(1)}s)</span>
          </div>
        )}

        {/* Flare Gun Rage Indicator */}
        {rageTime > 0 && (
          <div className="flex items-center gap-1.5 bg-red-950/90 border border-red-500 text-red-200 px-3 py-1 rounded-full text-xs font-black animate-bounce shadow-xl backdrop-blur-sm">
            <Flame className="w-4 h-4 text-red-500 fill-red-500" />
            <span>RAGE BLAST ({rageTime.toFixed(1)}s)</span>
          </div>
        )}
      </div>
    </div>
  );
};
