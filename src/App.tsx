import { useState, useRef, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { GameOverModal } from './components/GameOverModal';
import { CustomizerModal } from './components/CustomizerModal';
import { GameEngine, GameState } from './game/engine';
import { audioManager } from './game/audio';

export function App() {
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [shield, setShield] = useState<boolean>(false);
  const [energyTime, setEnergyTime] = useState<number>(0);
  const [rageTime, setRageTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(audioManager.getIsMuted());
  const [memeText, setMemeText] = useState<string | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [debugHitbox, setDebugHitbox] = useState<boolean>(false);

  const memeTimeoutRef = useRef<number | null>(null);

  const handleMemePopup = (quote: string) => {
    setMemeText(quote);
    if (memeTimeoutRef.current) clearTimeout(memeTimeoutRef.current);
    memeTimeoutRef.current = window.setTimeout(() => {
      setMemeText(null);
    }, 1800);
  };

  const handleToggleMute = () => {
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
  };

  const handleTogglePause = () => {
    engineRef.current?.togglePause();
  };

  const handleRestart = () => {
    audioManager.stopGameOverAudio();
    engineRef.current?.restart();
  };

  const handleCustomSpriteLoaded = (url: string) => {
    engineRef.current?.player.setCustomSpriteFromUrl(url);
  };

  const handleResetDefaultSprite = () => {
    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') + '/';
    engineRef.current?.player.attemptLoadCustomSprite(`${baseUrl}assets/character.svg`);
  };

  const handleToggleDebugHitbox = () => {
    if (engineRef.current) {
      engineRef.current.debugHitbox = !engineRef.current.debugHitbox;
      setDebugHitbox(engineRef.current.debugHitbox);
    }
  };

  // Keyboard shortcut for customizer or restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyC') {
        setIsCustomizerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="relative w-screen h-screen bg-zinc-950 flex items-center justify-center overflow-hidden font-['Montserrat',sans-serif]">
      {/* Game Canvas Container */}
      <div className="relative w-full h-full max-w-[480px] max-h-[850px] shadow-2xl flex items-center justify-center">
        <GameCanvas
          onEngineReady={(engine) => {
            engineRef.current = engine;
          }}
          onStateChange={(state) => setGameState(state)}
          onScoreUpdate={(s, hs, c) => {
            setScore(s);
            setHighScore(hs);
            setCombo(c);
          }}
          onPowerupUpdate={(s, et, rt) => {
            setShield(s);
            setEnergyTime(et);
            setRageTime(rt);
          }}
          onMemePopup={handleMemePopup}
        />

        {/* HUD Layer */}
        <HUD
          score={score}
          highScore={highScore}
          combo={combo}
          shield={shield}
          energyTime={energyTime}
          rageTime={rageTime}
          isMuted={isMuted}
          isPaused={gameState === 'PAUSED'}
          memeText={memeText}
          gameState={gameState}
          onToggleMute={handleToggleMute}
          onTogglePause={handleTogglePause}
          onOpenCustomizer={() => setIsCustomizerOpen(true)}
        />

        {/* Idle Start Overlay */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none p-6 text-center select-none z-15 animate-fade-in">
            {/* Title Badge */}
            <div className="bg-amber-500 text-zinc-950 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-2 shadow-lg">
              TELUGU MASS x PUBG BATTLEGROUND
            </div>

            <h1 className="font-['Black_Ops_One',sans-serif] text-5xl md:text-6xl text-amber-400 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] tracking-wider">
              FLYING PUNJU
            </h1>

            <p className="text-zinc-200 text-xs md:text-sm font-bold mt-1 tracking-wide drop-shadow-md">
              POCHINKI CHICKEN DINNER EDITION
            </p>

            {/* Tap / Press prompt */}
            <div className="mt-10 bg-zinc-900/90 border border-amber-500/50 px-6 py-3 rounded-2xl shadow-2xl animate-pulse">
              <span className="text-amber-400 font-black text-sm md:text-base tracking-widest uppercase">
                👉 TAP SCREEN OR PRESS SPACE TO FLY 👈
              </span>
            </div>

            {/* Quick guide icons */}
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-xs text-[11px] text-zinc-300">
              <div className="bg-zinc-900/70 p-2 rounded-xl border border-zinc-800">
                <div className="text-base">🪖</div>
                <div className="font-bold text-amber-300">Lv 3 Helmet</div>
                <div className="text-[10px] text-zinc-400">Absorbs 1 Hit</div>
              </div>
              <div className="bg-zinc-900/70 p-2 rounded-xl border border-zinc-800">
                <div className="text-base">⚡</div>
                <div className="font-bold text-sky-300">Energy Drink</div>
                <div className="text-[10px] text-zinc-400">2X & Magnet</div>
              </div>
              <div className="bg-zinc-900/70 p-2 rounded-xl border border-zinc-800">
                <div className="text-base">🔫</div>
                <div className="font-bold text-red-400">Flare Gun</div>
                <div className="text-[10px] text-zinc-400">Rage Smash</div>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === 'GAMEOVER' && (
          <GameOverModal
            score={score}
            highScore={highScore}
            onRestart={handleRestart}
            onOpenCustomizer={() => setIsCustomizerOpen(true)}
          />
        )}
      </div>

      {/* Asset Customizer Studio Modal */}
      <CustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        onCustomSpriteLoaded={handleCustomSpriteLoaded}
        onResetDefaultSprite={handleResetDefaultSprite}
        debugHitbox={debugHitbox}
        onToggleDebugHitbox={handleToggleDebugHitbox}
      />
    </main>
  );
}

export default App;
