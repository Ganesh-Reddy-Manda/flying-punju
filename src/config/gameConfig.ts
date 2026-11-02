export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  gravity: number;
  flapStrength: number;
  maxFallSpeed: number;
  baseSpeed: number;
  speedIncrement: number;
  maxSpeed: number;
  obstacleWidth: number;
  obstacleGap: number;
  obstacleSpawnInterval: number; // in frames at 60fps
  hitboxRadius: number;
  powerups: {
    helmetDurationHits: number;
    energyDrinkDurationSec: number;
    rageModeDurationSec: number;
  };
  memeQuotes: string[];
}

export const GAME_CONFIG: GameConfig = {
  canvasWidth: 450,
  canvasHeight: 750,
  gravity: 0.36,
  flapStrength: -7.6,
  maxFallSpeed: 9.5,
  baseSpeed: 2.8,
  speedIncrement: 0.04,
  maxSpeed: 5.5,
  obstacleWidth: 70,
  obstacleGap: 165,
  obstacleSpawnInterval: 125,
  hitboxRadius: 19,
  powerups: {
    helmetDurationHits: 1,
    energyDrinkDurationSec: 8,
    rageModeDurationSec: 5.5,
  },
  memeQuotes: [
    "MASS ENTRY!",
    "POCHINKI MASS!",
    "ROYAL PUNJU!",
    "THIGH SLAP POWER!",
    "DON'T TROUBLE THE TROUBLE!",
    "LEVEL 3 MASS!",
    "ROOSTER RAMPAGE!",
    "WINNER WINNER CHICKEN DINNER!",
  ],
};
