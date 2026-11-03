import { GAME_CONFIG } from '../config/gameConfig';
import { ParticleSystem } from './particles';

export class PunjuPlayer {
  public x: number;
  public y: number;
  public velocity: number = 0;
  public rotation: number = 0;
  public radius: number = GAME_CONFIG.hitboxRadius;

  // Power-up states
  public shieldActive: boolean = false;
  public energyDrinkTimer: number = 0;
  public rageTimer: number = 0;
  public invulnerableTimer: number = 0;

  // Wing flapping animation
  private wingAngle: number = 0;
  private isFlapping: boolean = false;

  // Custom Character Image
  private customImage: HTMLImageElement | null = null;
  private customImageLoaded: boolean = false;

  constructor() {
    this.x = GAME_CONFIG.canvasWidth * 0.28;
    this.y = GAME_CONFIG.canvasHeight * 0.42;

    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') + '/';
    this.attemptLoadCustomSprite([
      `${baseUrl}assets/character.png`,
      `${baseUrl}assets/character.jpg`,
      `${baseUrl}assets/character.jpeg`,
      `${baseUrl}assets/character.webp`,
      `${baseUrl}assets/character.svg`,
    ]);
  }

  public attemptLoadCustomSprite(sources: string | string[]) {
    const list = Array.isArray(sources) ? [...sources] : [sources];
    if (list.length === 0) return;

    const current = list[0];
    const remaining = list.slice(1);

    const img = new Image();
    img.src = current;
    img.onload = () => {
      // Ignore empty/dummy 1x1 pixels if alternatives exist
      if (img.width <= 2 && img.height <= 2 && remaining.length > 0) {
        this.attemptLoadCustomSprite(remaining);
        return;
      }
      this.customImage = img;
      this.customImageLoaded = true;
    };
    img.onerror = () => {
      if (remaining.length > 0) {
        this.attemptLoadCustomSprite(remaining);
      }
    };
  }

  public setCustomSpriteFromUrl(url: string) {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.customImage = img;
      this.customImageLoaded = true;
    };
  }

  public flap(particles: ParticleSystem) {
    this.velocity = GAME_CONFIG.flapStrength;
    this.rotation = -0.45; // ~ -25 degrees up
    this.isFlapping = true;
    this.wingAngle = -0.5;

    // Spawn feather burst behind Punju
    particles.spawnFeathers(this.x, this.y, 4);
  }

  public update(dt: number, particles: ParticleSystem) {
    const factor = dt * 60;

    // Apply gravity
    this.velocity += GAME_CONFIG.gravity * factor;
    if (this.velocity > GAME_CONFIG.maxFallSpeed) {
      this.velocity = GAME_CONFIG.maxFallSpeed;
    }

    this.y += this.velocity * factor;

    // Smooth rotation: slowly tilt nose-down when falling
    if (this.velocity > 0) {
      this.rotation = Math.min(1.2, this.rotation + 0.05 * factor); // up to ~70 degrees down
    } else {
      this.rotation = Math.max(-0.45, this.rotation - 0.03 * factor);
    }

    // Wing flap recovery
    if (this.wingAngle < 0) {
      this.wingAngle += 0.08 * factor;
    }

    // Powerup Timers
    if (this.energyDrinkTimer > 0) {
      this.energyDrinkTimer -= dt;
    }
    if (this.rageTimer > 0) {
      this.rageTimer -= dt;
      particles.spawnRageTrail(this.x, this.y);
    }
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
  }

  public draw(ctx: CanvasRenderingContext2D, debugHitbox: boolean = false) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Invulnerability flash after shield break
    if (this.invulnerableTimer > 0 && Math.sin(Date.now() * 0.03) > 0) {
      ctx.globalAlpha = 0.5;
    }

    // Rage Mode Aura
    if (this.rageTimer > 0) {
      this.drawRageAura(ctx);
    }

    // Energy Drink Electric Aura
    if (this.energyDrinkTimer > 0) {
      this.drawEnergyAura(ctx);
    }

    // Level 3 Helmet Shield Bubble
    if (this.shieldActive) {
      this.drawShieldBubble(ctx);
    }

    // Rotate player
    ctx.rotate(this.rotation);

    // Draw Character (Custom Image or Built-in Procedural Punju)
    if (this.customImage && this.customImageLoaded) {
      this.drawCustomImage(ctx);
    } else {
      this.drawProceduralPunju(ctx);
    }

    // Level 3 Helmet visual overlay if equipped
    if (this.shieldActive) {
      this.drawLevel3HelmetOverlay(ctx);
    }

    ctx.restore();

    // Visual Hitbox overlay for debugging / calibration
    if (debugHitbox) {
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawCustomImage(ctx: CanvasRenderingContext2D) {
    if (!this.customImage) return;
    const size = this.radius * 2.3;
    ctx.save();
    // Automatically clip everything outside the circular hitbox line
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(this.customImage, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  // High-Detail Procedural "Battle Punju" (Telugu Mass Fighting Rooster)
  private drawProceduralPunju(ctx: CanvasRenderingContext2D) {
    // 1. Tail Feathers (Fierce rooster tail)
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.quadraticCurveTo(-34, -20, -22, -26);
    ctx.quadraticCurveTo(-18, -12, -10, -4);
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(-14, 2);
    ctx.quadraticCurveTo(-32, -8, -26, -16);
    ctx.quadraticCurveTo(-14, -6, -8, 2);
    ctx.fill();

    // 2. Rooster Torso
    const bodyGrad = ctx.createLinearGradient(-18, -14, 18, 14);
    bodyGrad.addColorStop(0, '#f59e0b');
    bodyGrad.addColorStop(0.5, '#d97706');
    bodyGrad.addColorStop(1, '#92400e');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 2, 19, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Rooster Head & Neck
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(12, -7, 10, 11, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Red Comb (Spiky crown)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(7, -16);
    ctx.lineTo(9, -24);
    ctx.lineTo(13, -18);
    ctx.lineTo(16, -25);
    ctx.lineTo(19, -17);
    ctx.lineTo(21, -22);
    ctx.lineTo(22, -13);
    ctx.closePath();
    ctx.fill();

    // 5. Golden Beak
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(18, -7);
    ctx.lineTo(28, -4);
    ctx.lineTo(18, -1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 6. Red Wattle (under beak)
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(17, 3, 4, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 7. Balayya Mass Aviator Sunglasses
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.4;
    ctx.fillRect(10, -11, 10, 7);
    ctx.strokeRect(10, -11, 10, 7);
    // Glare shine
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(12, -10);
    ctx.lineTo(15, -5);
    ctx.stroke();

    // 8. Military Bandolier (PUBG bullet strap across chest)
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(8, 11);
    ctx.stroke();
    // Bullet studs
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-2, -1, 1.5, 0, Math.PI * 2);
    ctx.arc(4, 6, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 9. Wing (Flapping angle)
    ctx.save();
    ctx.translate(-2, 2);
    ctx.rotate(this.wingAngle);
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 7, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawLevel3HelmetOverlay(ctx: CanvasRenderingContext2D) {
    // Spetsnaz Level 3 helmet worn over Punju's head
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(13, -10, 12, Math.PI * 0.9, Math.PI * 2);
    ctx.lineTo(24, -4);
    ctx.lineTo(4, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Steel Visor Slit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, -8, 14, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(10, -7, 10, 2);
    ctx.restore();
  }

  private drawShieldBubble(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.08;
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, (this.radius + 12) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawEnergyAura(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const pulse = 1 + Math.sin(Date.now() * 0.015) * 0.12;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, (this.radius + 8) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawRageAura(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const pulse = 1 + Math.sin(Date.now() * 0.02) * 0.18;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, (this.radius + 14) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  public reset() {
    this.x = GAME_CONFIG.canvasWidth * 0.28;
    this.y = GAME_CONFIG.canvasHeight * 0.42;
    this.velocity = 0;
    this.rotation = 0;
    this.shieldActive = false;
    this.energyDrinkTimer = 0;
    this.rageTimer = 0;
    this.invulnerableTimer = 0;
  }
}
