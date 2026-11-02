export type CollectibleType = 'helmet' | 'energyDrink' | 'flareGun' | 'corn';

export interface Collectible {
  id: number;
  x: number;
  y: number;
  radius: number;
  type: CollectibleType;
  bobOffset: number;
  collected: boolean;
}

export class CollectibleManager {
  private items: Collectible[] = [];
  private nextId: number = 1;

  public spawnInGap(x: number, gapCenterY: number, score: number) {
    // Determine what to spawn:
    // 50% Golden Corn
    // 20% Level 3 Helmet
    // 20% Energy Drink
    // 10% Flare Gun (rare & thrilling)
    const rand = Math.random();
    let type: CollectibleType = 'corn';

    if (rand < 0.45) {
      type = 'corn';
    } else if (rand < 0.68) {
      type = 'helmet';
    } else if (rand < 0.88) {
      type = 'energyDrink';
    } else {
      type = 'flareGun';
    }

    this.items.push({
      id: this.nextId++,
      x,
      y: gapCenterY + (Math.random() * 40 - 20),
      radius: type === 'corn' ? 12 : 16,
      type,
      bobOffset: Math.random() * Math.PI * 2,
      collected: false,
    });
  }

  public update(dt: number, gameSpeed: number, playerX: number, playerY: number, isMagnetActive: boolean) {
    const factor = dt * 60;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.x -= gameSpeed * factor;
      item.bobOffset += 0.08 * factor;

      // Magnet pull when Energy Drink is active
      if (isMagnetActive && !item.collected) {
        const dx = playerX - item.x;
        const dy = playerY - item.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 190) {
          item.x += (dx / dist) * 7 * factor;
          item.y += (dy / dist) * 7 * factor;
        }
      }

      // Remove offscreen items
      if (item.x < -40 || item.collected) {
        this.items.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    for (const item of this.items) {
      if (item.collected) continue;
      const bobY = item.y + Math.sin(item.bobOffset) * 4;

      ctx.save();
      ctx.translate(item.x, bobY);

      switch (item.type) {
        case 'helmet':
          this.drawLevel3Helmet(ctx);
          break;
        case 'energyDrink':
          this.drawEnergyDrink(ctx);
          break;
        case 'flareGun':
          this.drawFlareGun(ctx);
          break;
        case 'corn':
          this.drawCorn(ctx);
          break;
      }

      ctx.restore();
    }
  }

  // PUBG Level 3 Spetsnaz Helmet
  private drawLevel3Helmet(ctx: CanvasRenderingContext2D) {
    // Glow ring
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Dark grey dome
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, -2, 12, Math.PI, 0);
    ctx.lineTo(12, 6);
    ctx.lineTo(-12, 6);
    ctx.closePath();
    ctx.fill();

    // Steel Visor Slit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-10, 0, 20, 5);
    ctx.fillStyle = '#38bdf8'; // Blue glass reflection
    ctx.fillRect(-8, 1, 16, 2);

    // Lv 3 Badge
    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 9px monospace';
    ctx.fillText('LV3', -8, -4);
  }

  // PUBG Energy Drink Can
  private drawEnergyDrink(ctx: CanvasRenderingContext2D) {
    // Glow
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();

    // Can body
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-8, -12, 16, 24);

    // Silver rims
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-8, -13, 16, 2);
    ctx.fillRect(-8, 11, 16, 2);

    // Lightning bolt logo
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(2, -8);
    ctx.lineTo(-3, 0);
    ctx.lineTo(1, 0);
    ctx.lineTo(-2, 8);
    ctx.lineTo(4, -1);
    ctx.lineTo(0, -1);
    ctx.closePath();
    ctx.fill();
  }

  // Flare Gun
  private drawFlareGun(ctx: CanvasRenderingContext2D) {
    // Fiery pulse glow
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Bright orange barrel & handle
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-10, -6, 20, 8);
    ctx.fillRect(-8, 2, 7, 10);

    // Golden muzzle & trigger
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(8, -8, 4, 12);
  }

  // Golden Battle Corn
  private drawCorn(ctx: CanvasRenderingContext2D) {
    // Golden corn kernel
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 13, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Green husk leaves
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.moveTo(-6, 8);
    ctx.quadraticCurveTo(-10, 0, -6, -8);
    ctx.lineTo(-4, 8);
    ctx.fill();

    // Sparkle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-2, -3, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  public getItems(): Collectible[] {
    return this.items;
  }

  public clear() {
    this.items = [];
  }
}
