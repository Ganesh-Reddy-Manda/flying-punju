import React, { useState } from 'react';
import { RotateCcw, Share2, Trophy, Palette, Check } from 'lucide-react';
import { audioManager } from '../game/audio';

interface GameOverModalProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onOpenCustomizer: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  onRestart,
  onOpenCustomizer,
}) => {
  const [copied, setCopied] = useState(false);

  // Dynamic Rank Calculation
  const getRank = (pts: number) => {
    if (pts >= 50) return { title: 'Legendary Conqueror Punju 👑', desc: 'True Battleground King!' };
    if (pts >= 30) return { title: 'Balayya Mass Punju ⚡', desc: 'Thigh Slap Power Overwhelming!' };
    if (pts >= 15) return { title: 'Level 3 Fighter Cock 🪖', desc: 'Pochinki Champion!' };
    if (pts >= 5) return { title: 'Battleground Rooster 🍗', desc: 'Survivor Instincts!' };
    return { title: 'Novice Chick 🐥', desc: 'Need more practice in Pochinki!' };
  };

  const rank = getRank(score);
  const isWinner = score >= 20;

  const handleShare = () => {
    const text = `🐓 I just scored ${score} pts in Flying Punju (PUBG Edition)! My Rank: ${rank.title}. Can you beat my record? Play now!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-20 animate-fade-in">
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-amber-500/40 rounded-2xl p-6 w-full max-w-sm text-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
        {/* Banner */}
        <div className="mb-4">
          {isWinner ? (
            <div className="inline-block bg-amber-500 text-zinc-950 px-4 py-1.5 rounded-full font-black text-sm uppercase tracking-wider animate-bounce">
              🏆 WINNER WINNER CHICKEN DINNER!
            </div>
          ) : (
            <div className="inline-block bg-red-600/90 text-white px-4 py-1 rounded-full font-black text-xs uppercase tracking-wider">
              💀 ELIMINATED IN ERANGEL
            </div>
          )}
          <h2 className="font-['Black_Ops_One',sans-serif] text-3xl text-amber-400 mt-2 tracking-wide uppercase">
            {isWinner ? 'CHICKEN DINNER!' : 'GAME OVER'}
          </h2>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-3 flex flex-col items-center">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Score</span>
            <span className="font-['Black_Ops_One',sans-serif] text-4xl text-amber-400 mt-1">{score}</span>
          </div>
          <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-3 flex flex-col items-center">
            <div className="flex items-center gap-1 text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Best</span>
            </div>
            <span className="font-['Black_Ops_One',sans-serif] text-4xl text-zinc-100 mt-1">{highScore}</span>
          </div>
        </div>

        {/* Rank & Title */}
        <div className="bg-zinc-900/90 border border-amber-500/20 rounded-xl p-3 mb-5">
          <div className="text-amber-400 font-extrabold text-sm">{rank.title}</div>
          <div className="text-zinc-400 text-xs mt-0.5">{rank.desc}</div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* Restart Button */}
          <button
            onClick={() => {
              audioManager.stopGameOverAudio();
              onRestart();
            }}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-black py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-base tracking-wider uppercase"
          >
            <RotateCcw className="w-5 h-5" />
            <span>REDEPLOY / PLAY AGAIN</span>
          </button>

          {/* Secondary row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShare}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all border border-zinc-700"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Share Score'}</span>
            </button>

            <button
              onClick={onOpenCustomizer}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all border border-zinc-700"
            >
              <Palette className="w-4 h-4 text-amber-400" />
              <span>Customize</span>
            </button>
          </div>
        </div>

        <div className="mt-4 text-zinc-500 text-[11px] font-mono">
          [Press SPACE or TAP anywhere to play again]
        </div>
      </div>
    </div>
  );
};
