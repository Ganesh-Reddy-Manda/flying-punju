import React, { useEffect, useRef } from 'react';
import { GameEngine, GameState } from '../game/engine';

interface GameCanvasProps {
  onEngineReady: (engine: GameEngine) => void;
  onStateChange: (state: GameState) => void;
  onScoreUpdate: (score: number, highScore: number, combo: number) => void;
  onPowerupUpdate: (shield: boolean, energyTime: number, rageTime: number) => void;
  onMemePopup: (quote: string) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onEngineReady,
  onStateChange,
  onScoreUpdate,
  onPowerupUpdate,
  onMemePopup,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, {
      onStateChange,
      onScoreUpdate,
      onPowerupUpdate,
      onMemePopup,
    });

    engineRef.current = engine;
    onEngineReady(engine);
    engine.start();

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        engine.handleInput();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        engine.togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Resize handler
    const handleResize = () => {
      engine.initCanvasSize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      engine.stop();
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent default touch gestures / zooming
    e.preventDefault();
    engineRef.current?.handleInput();
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none"
      onPointerDown={handlePointerDown}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[480px] max-h-[850px] aspect-[450/750] object-contain shadow-2xl rounded-none md:rounded-2xl border-0 md:border md:border-zinc-800"
      />
    </div>
  );
};
