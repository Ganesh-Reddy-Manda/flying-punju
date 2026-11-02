import { GAME_CONFIG } from '../config/gameConfig';

export interface Obstacle {
  id: number;
  x: number;
  width: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
  nearMissAwarded: boolean;
  destroyed: boolean;
  hasPanHazard: boolean;
  panY?: number;
  panSway?: number;
}

export class ObstacleManager {
  private obstacles: Obstacle[] = [];
  private nextId: number = 1;
  private spawnTimer: number = 0;

  public update(
    dt: number,
    gameSpeed: number,
    score: number,
    onSpawnGapItem?: (x: number, gapCenterY: number) => void
  ) {
    const factor = dt * 60;
    this.spawnTimer += factor;

    // Spawn new obstacle pair
    if (this.spawnTimer >= GAME_CONFIG.obstacleSpawnInterval) {
      this.spawnObstacle(onSpawnGapItem, score);
      this.spawnTimer = 0;
    }

    // Move existing obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= gameSpeed * factor;

      if (obs.hasPanHazard && obs.panSway !== undefined && obs.panY !== undefined) {
        obs.panSway += 0.05 * factor;
      }

      // Remove off-screen obstacles
      if (obs.x + obs.width < -50) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private spawnObstacle(
    onSpawnGapItem?: (x: number, gapCenterY: number) => void,
    score: number = 0
  ) {
    const minTop = 60;
    const maxTop = GAME_CONFIG.canvasHeight * 0.85 - GAME_CONFIG.obstacleGap - 60;
    const topHeight = Math.floor(minTop + Math.random() * (maxTop - minTop));
    const bottomY = topHeight + GAME_CONFIG.obstacleGap;
    const gapCenterY = topHeight + GAME_CONFIG.obstacleGap / 2;

    // 25% chance of a hovering PUBG frying pan hazard after score >= 5
    const hasPanHazard = score >= 5 && Math.random() < 0.28;

    this.obstacles.push({
      id: this.nextId++,
      x: GAME_CONFIG.canvasWidth + 20,
      width: GAME_CONFIG.obstacleWidth,
      topHeight,
      bottomY,
      passed: false,
      nearMissAwarded: false,
      destroyed: false,
      hasPanHazard,
      panY: gapCenterY + (Math.random() * 30 - 15),
      panSway: 0,
    });

    // Notify collectible manager to spawn power-up or corn in the gap
    if (onSpawnGapItem) {
      onSpawnGapItem(GAME_CONFIG.canvasWidth + 20 + GAME_CONFIG.obstacleWidth / 2, gapCenterY);
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    for (const obs of this.obstacles) {
      if (obs.destroyed) continue;

      // Draw Top Military Sniper Tower
      this.drawTower(ctx, obs.x, 0, obs.width, obs.topHeight, true);

      // Draw Bottom Military Sniper Tower
      const groundY = GAME_CONFIG.canvasHeight * 0.85;
      const bottomHeight = groundY - obs.bottomY;
      this.drawTower(ctx, obs.x, obs.bottomY, obs.width, bottomHeight, false);

      // Draw PUBG Frying Pan Hazard if present
      if (obs.hasPanHazard && obs.panY !== undefined) {
        const panBob = obs.panY + Math.sin(obs.panSway || 0) * 12;
        this.drawFryingPan(ctx, obs.x + obs.width / 2, panBob);
      }
    }
  }

  private drawTower(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isTop: boolean
  ) {
    ctx.save();

    // Steel Pillar Body
    const steelGrad = ctx.createLinearGradient(x, 0, x + width, 0);
    steelGrad.addColorStop(0, '#1c1917');
    steelGrad.addColorStop(0.3, '#3f3f46');
    steelGrad.addColorStop(0.7, '#27272a');
    steelGrad.addColorStop(1, '#09090b');

    ctx.fillStyle = steelGrad;
    ctx.fillRect(x, y, width, height);

    // Hazard Caution Stripes on tower tip (facing the opening gap)
    const capHeight = 24;
    const capY = isTop ? y + height - capHeight : y;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 4, capY, width + 8, capHeight);
    ctx.clip();

    ctx.fillStyle = '#eab308'; // Warning yellow
    ctx.fillRect(x - 4, capY, width + 8, capHeight);

    ctx.fillStyle = '#18181b'; // Black hazard stripes
    for (let sx = x - 20; sx < x + width + 20; sx += 16) {
      ctx.beginPath();
      ctx.moveTo(sx, capY);
      ctx.lineTo(sx + 10, capY);
      ctx.lineTo(sx + 20, capY + capHeight);
      ctx.lineTo(sx + 10, capY + capHeight);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Steel tower border / rivets
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 4, capY, width + 8, capHeight);
    ctx.strokeRect(x, y, width, height);

    // Rivet dots
    ctx.fillStyle = '#a1a1aa';
    for (let ry = y + 15; ry < y + height - 15; ry += 35) {
      ctx.beginPath();
      ctx.arc(x + 6, ry, 2, 0, Math.PI * 2);
      ctx.arc(x + width - 6, ry, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Camo mesh line
    ctx.strokeStyle = 'rgba(22, 101, 52, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + width - 4, y + height);
    ctx.stroke();

    ctx.restore();
  }

  // PUBG Frying Pan Hazard
  private drawFryingPan(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);

    // Pan shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(2, 2, 13, 0, Math.PI * 2);
    ctx.fill();

    // Cast Iron Pan Body
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // PUBG Pan Handle
    ctx.fillStyle = '#27272a';
    ctx.fillRect(11, -3, 14, 6);
    ctx.strokeStyle = '#52525b';
    ctx.strokeRect(11, -3, 14, 6);

    // Inner pan reflection
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    // Center PUBG Winner Winner Text or Star
    ctx.fillStyle = '#facc15';
    ctx.font = '900 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PUBG', 0, 0);

    ctx.restore();
  }

  public getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  public clear() {
    this.obstacles = [];
    this.spawnTimer = 0;
  }
}
