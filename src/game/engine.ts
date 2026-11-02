import { GAME_CONFIG } from '../config/gameConfig';
import { PunjuPlayer } from './punju';
import { ParallaxBackground } from './background';
import { ObstacleManager } from './obstacles';
import { CollectibleManager } from './collectibles';
import { ParticleSystem } from './particles';
import { CollisionSystem } from './collision';
import { audioManager } from './audio';
import confetti from 'canvas-confetti';

export type GameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface GameEngineCallbacks {
  onStateChange: (state: GameState) => void;
  onScoreUpdate: (score: number, highScore: number, combo: number) => void;
  onPowerupUpdate: (shield: boolean, energyTime: number, rageTime: number) => void;
  onMemePopup: (text: string) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState = 'IDLE';

  // Game Systems
  public player: PunjuPlayer;
  public background: ParallaxBackground;
  public obstacles: ObstacleManager;
  public collectibles: CollectibleManager;
  public particles: ParticleSystem;

  // Game Stats
  private score: number = 0;
  private highScore: number = 0;
  private combo: number = 1;
  private gameSpeed: number = GAME_CONFIG.baseSpeed;

  // Visual effects
  private screenShake: number = 0;
  public debugHitbox: boolean = false;

  // Loop & Timing
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private callbacks: GameEngineCallbacks;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    this.callbacks = callbacks;
    this.player = new PunjuPlayer();
    this.background = new ParallaxBackground(GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);
    this.obstacles = new ObstacleManager();
    this.collectibles = new CollectibleManager();
    this.particles = new ParticleSystem();

    // Load High Score
    try {
      const saved = localStorage.getItem('flying_punju_highscore');
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
      }
    } catch {
      // Ignore
    }

    this.callbacks.onScoreUpdate(this.score, this.highScore, this.combo);
    this.initCanvasSize();
  }

  public initCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = GAME_CONFIG.canvasWidth * dpr;
    this.canvas.height = GAME_CONFIG.canvasHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  public start() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    audioManager.stopBGM();
  }

  public handleInput() {
    if (this.state === 'IDLE') {
      this.state = 'PLAYING';
      this.callbacks.onStateChange(this.state);
      audioManager.startBGM();
      this.player.flap(this.particles);
      audioManager.play('flap');
    } else if (this.state === 'PLAYING') {
      this.player.flap(this.particles);
      audioManager.play('flap');
    } else if (this.state === 'GAMEOVER') {
      this.restart();
    }
  }

  public togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.callbacks.onStateChange(this.state);
      audioManager.stopBGM();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.callbacks.onStateChange(this.state);
      audioManager.startBGM();
      this.lastTime = performance.now();
    }
  }

  public restart() {
    this.state = 'PLAYING';
    this.score = 0;
    this.combo = 1;
    this.gameSpeed = GAME_CONFIG.baseSpeed;
    this.player.reset();
    this.obstacles.clear();
    this.collectibles.clear();
    this.particles.clear();
    this.screenShake = 0;

    this.callbacks.onStateChange(this.state);
    this.callbacks.onScoreUpdate(this.score, this.highScore, this.combo);
    this.callbacks.onPowerupUpdate(false, 0, 0);

    audioManager.startBGM();
    this.player.flap(this.particles);
    audioManager.play('flap');
  }

  private loop = (currentTime: number) => {
    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    const dt = Math.min(rawDt, 0.1); // prevent physics teleport on tab unfocus

    if (this.state === 'PLAYING' || this.state === 'IDLE') {
      this.update(dt);
    }
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    if (this.state === 'IDLE') {
      // Idle bobbing animation
      this.player.y = GAME_CONFIG.canvasHeight * 0.42 + Math.sin(Date.now() * 0.005) * 8;
      this.background.update(dt, 1.2);
      this.particles.update(dt);
      return;
    }

    // Dynamic game speed scaling
    this.gameSpeed = Math.min(
      GAME_CONFIG.maxSpeed,
      GAME_CONFIG.baseSpeed + this.score * GAME_CONFIG.speedIncrement
    );

    // Update World Systems
    this.background.update(dt, this.gameSpeed);
    this.player.update(dt, this.particles);
    this.particles.update(dt);

    const isMagnetActive = this.player.energyDrinkTimer > 0;
    this.collectibles.update(dt, this.gameSpeed, this.player.x, this.player.y, isMagnetActive);

    this.obstacles.update(
      dt,
      this.gameSpeed,
      this.score,
      (spawnX, gapY) => {
        this.collectibles.spawnInGap(spawnX, gapY, this.score);
      }
    );

    // Obstacle scoring
    for (const obs of this.obstacles.getObstacles()) {
      if (!obs.passed && obs.x + obs.width < this.player.x) {
        obs.passed = true;
        const multiplier = this.player.energyDrinkTimer > 0 ? 2 : 1;
        this.score += 1 * multiplier;
        audioManager.play('point');
        this.particles.spawnFloatingText(
          this.player.x,
          this.player.y - 25,
          `+${multiplier}`,
          '#facc15'
        );

        // Check for milestone fanfare
        if (this.score === 10 || this.score === 25 || this.score === 50 || this.score === 100) {
          audioManager.play('winner');
          this.triggerWinnerFanfare();
        }

        this.checkHighScore();
        this.callbacks.onScoreUpdate(this.score, this.highScore, this.combo);
      }
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake -= dt * 25;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    // Evaluate Collisions
    const collision = CollisionSystem.evaluate(
      this.player,
      this.obstacles.getObstacles(),
      this.collectibles.getItems()
    );

    // 1. Handle Collectibles
    for (const item of collision.collectedItems) {
      audioManager.play('powerup');
      switch (item.type) {
        case 'helmet':
          this.player.shieldActive = true;
          this.particles.spawnFloatingText(item.x, item.y, 'LEVEL 3 HELMET!', '#38bdf8');
          this.triggerMeme('LEVEL 3 MASS!');
          break;
        case 'energyDrink':
          this.player.energyDrinkTimer = GAME_CONFIG.powerups.energyDrinkDurationSec;
          this.particles.spawnFloatingText(item.x, item.y, 'ENERGY BOOST 2X!', '#38bdf8');
          this.triggerMeme('ENERGY DRINK SURGE!');
          break;
        case 'flareGun':
          this.player.rageTimer = GAME_CONFIG.powerups.rageModeDurationSec;
          audioManager.play('rage');
          this.screenShake = 6;
          this.particles.spawnFloatingText(item.x, item.y, 'RAGE BLAST!', '#ef4444');
          this.triggerMeme('ROOSTER RAMPAGE!');
          break;
        case 'corn':
          this.score += 2;
          this.particles.spawnFloatingText(item.x, item.y, '+2 CORN', '#facc15');
          this.checkHighScore();
          this.callbacks.onScoreUpdate(this.score, this.highScore, this.combo);
          break;
      }
    }

    // 2. Handle Near-Miss Combo
    if (collision.nearMiss) {
      this.combo = Math.min(5, this.combo + 1);
      audioManager.play('nearMiss');
      const bonus = 5 * this.combo;
      this.score += bonus;
      this.particles.spawnFloatingText(
        this.player.x + 20,
        this.player.y - 15,
        `MASS! x${this.combo}`,
        '#f97316'
      );
      this.triggerMeme('THIGH SLAP MASS!');
      this.checkHighScore();
      this.callbacks.onScoreUpdate(this.score, this.highScore, this.combo);
    }

    // 3. Handle Ground Collision (Fatal)
    if (collision.hitGround) {
      this.triggerGameOver();
      return;
    }

    // 4. Handle Obstacle Collision
    if (collision.hitObstacle) {
      // If Rage Mode is active: smash obstacle!
      if (this.player.rageTimer > 0) {
        const obs = this.obstacles.getObstacles()[collision.hitObstacleIndex];
        if (obs && !obs.destroyed) {
          obs.destroyed = true;
          this.screenShake = 10;
          audioManager.play('hit');
          this.particles.spawnExplosion(obs.x + obs.width / 2, this.player.y, '#ef4444', 25);
          this.particles.spawnFloatingText(this.player.x, this.player.y, 'SMASHED!', '#ef4444');
        }
        return;
      }

      // If Level 3 Helmet Shield is active: absorb hit!
      if (this.player.shieldActive && this.player.invulnerableTimer <= 0) {
        this.player.shieldActive = false;
        this.player.invulnerableTimer = 1.2;
        this.combo = 1;
        this.screenShake = 8;
        audioManager.play('shieldBreak');
        this.particles.spawnExplosion(this.player.x, this.player.y, '#38bdf8', 20);
        this.particles.spawnFloatingText(this.player.x, this.player.y, 'HELMET SAVED YOU!', '#38bdf8');
        return;
      }

      // If invulnerable from recent shield break: pass through safely
      if (this.player.invulnerableTimer > 0) {
        return;
      }

      // Fatal Obstacle Hit
      this.triggerGameOver();
    }

    // Update powerup state to UI
    this.callbacks.onPowerupUpdate(
      this.player.shieldActive,
      this.player.energyDrinkTimer,
      this.player.rageTimer
    );
  }

  private triggerGameOver() {
    this.state = 'GAMEOVER';
    this.screenShake = 14;
    audioManager.play('hit');
    audioManager.play('gameover');
    audioManager.stopBGM();
    this.particles.spawnExplosion(this.player.x, this.player.y, '#f59e0b', 30);
    this.checkHighScore();
    this.callbacks.onStateChange(this.state);
  }

  private checkHighScore() {
    if (this.score > this.highScore) {
      const isFirstBreak = this.highScore > 0 && this.score === this.highScore + 1;
      this.highScore = this.score;
      try {
        localStorage.setItem('flying_punju_highscore', String(this.highScore));
      } catch {
        // Ignore
      }
      if (isFirstBreak) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  }

  private triggerWinnerFanfare() {
    this.triggerMeme('WINNER WINNER CHICKEN DINNER!');
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#facc15', '#ef4444', '#38bdf8', '#22c55e'],
    });
  }

  private triggerMeme(quote: string) {
    this.callbacks.onMemePopup(quote);
  }

  private render() {
    this.ctx.save();

    // Screen Shake effect
    if (this.screenShake > 0) {
      const offsetX = (Math.random() - 0.5) * this.screenShake;
      const offsetY = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(offsetX, offsetY);
    }

    // Clear Canvas
    this.ctx.clearRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);

    // 1. Draw Parallax Background
    this.background.draw(this.ctx);

    // 2. Draw Obstacles
    this.obstacles.draw(this.ctx);

    // 3. Draw Collectibles
    this.collectibles.draw(this.ctx);

    // 4. Draw Particles
    this.particles.draw(this.ctx);

    // 5. Draw Punju Player
    this.player.draw(this.ctx, this.debugHitbox);

    this.ctx.restore();
  }

  public getScore(): number {
    return this.score;
  }

  public getHighScore(): number {
    return this.highScore;
  }

  public getState(): GameState {
    return this.state;
  }
}
