export class ParallaxBackground {
  private width: number;
  private height: number;
  private cloudScroll: number = 0;
  private hillScroll: number = 0;
  private groundScroll: number = 0;
  private planeX: number = -150;
  private planeActive: boolean = false;
  private planeTimer: number = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public update(dt: number, gameSpeed: number) {
    const factor = dt * 60;
    this.cloudScroll = (this.cloudScroll + 0.3 * factor) % this.width;
    this.hillScroll = (this.hillScroll + 0.8 * factor) % this.width;
    this.groundScroll = (this.groundScroll + gameSpeed * factor) % 40;

    // Plane logic
    this.planeTimer += dt;
    if (!this.planeActive && this.planeTimer > 12) {
      this.planeActive = true;
      this.planeX = -100;
      this.planeTimer = 0;
    }

    if (this.planeActive) {
      this.planeX += 1.8 * factor;
      if (this.planeX > this.width + 120) {
        this.planeActive = false;
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    // 1. Erangel Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height * 0.75);
    skyGrad.addColorStop(0, '#1e293b'); // Dark dusk military blue
    skyGrad.addColorStop(0.4, '#334155');
    skyGrad.addColorStop(0.75, '#b45309'); // Warm orange sunset battlefield horizon
    skyGrad.addColorStop(1, '#78350f');

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Distant Clouds
    this.drawClouds(ctx);

    // 3. Airdrop C-130 Plane
    if (this.planeActive) {
      this.drawAirdropPlane(ctx, this.planeX, 70);
    }

    // 4. Distant Erangel Mountains & Radio Towers
    this.drawMountains(ctx);

    // 5. Midground: Pochinki Compound & Hens
    this.drawPochinkiCompounds(ctx);

    // 6. Foreground: Ground trench & Military Barbed Wire
    this.drawGround(ctx);
  }

  private drawClouds(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // Subtle horizontal battlefield atmospheric haze (no circular sun shapes)
    ctx.fillStyle = 'rgba(203, 213, 225, 0.12)';

    const wisps = [
      { x: 20 - this.cloudScroll * 0.7, y: 45, w: 90, h: 10 },
      { x: 190 - this.cloudScroll * 0.7, y: 75, w: 120, h: 12 },
      { x: 340 - this.cloudScroll * 0.7, y: 35, w: 80, h: 8 },
      { x: 20 + this.width - this.cloudScroll * 0.7, y: 45, w: 90, h: 10 },
      { x: 190 + this.width - this.cloudScroll * 0.7, y: 75, w: 120, h: 12 },
      { x: 340 + this.width - this.cloudScroll * 0.7, y: 35, w: 80, h: 8 },
    ];

    for (const w of wisps) {
      ctx.beginPath();
      // Draw smooth elongated horizontal atmospheric bands
      ctx.roundRect ? ctx.roundRect(w.x, w.y, w.w, w.h, 6) : ctx.rect(w.x, w.y, w.w, w.h);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawAirdropPlane(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';

    // C-130 silhouette
    ctx.beginPath();
    ctx.ellipse(x, y, 42, 9, 0, 0, Math.PI * 2); // fuselage
    ctx.fill();

    // Wings
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 22);
    ctx.lineTo(x + 12, y);
    ctx.lineTo(x - 5, y + 22);
    ctx.lineTo(x - 12, y);
    ctx.closePath();
    ctx.fill();

    // Tail fin
    ctx.beginPath();
    ctx.moveTo(x - 38, y);
    ctx.lineTo(x - 45, y - 14);
    ctx.lineTo(x - 32, y);
    ctx.closePath();
    ctx.fill();

    // Jet contrails
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 42, y - 6);
    ctx.lineTo(x - 90, y - 6);
    ctx.moveTo(x - 42, y + 6);
    ctx.lineTo(x - 90, y + 6);
    ctx.stroke();

    ctx.restore();
  }

  private drawMountains(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const horizon = this.height * 0.72;

    // Distant mountain silhouette
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(0, horizon);

    for (let x = 0; x <= this.width + 40; x += 30) {
      const offsetX = x + this.hillScroll;
      const peakY = horizon - 45 - Math.sin(offsetX * 0.015) * 28 - Math.cos(offsetX * 0.04) * 14;
      ctx.lineTo(x, peakY);
    }
    ctx.lineTo(this.width, horizon);
    ctx.lineTo(0, horizon);
    ctx.fill();

    // Military Radio Tower with blinking beacon
    const towerX = ((this.width * 0.65 - this.hillScroll) % this.width + this.width) % this.width;
    const towerBaseY = horizon - 30;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(towerX - 8, towerBaseY);
    ctx.lineTo(towerX, towerBaseY - 45);
    ctx.lineTo(towerX + 8, towerBaseY);
    ctx.stroke();

    // Blinking red beacon light
    const blink = Math.sin(Date.now() * 0.006) > 0;
    if (blink) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(towerX, towerBaseY - 47, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawPochinkiCompounds(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const baseY = this.height * 0.78;

    // Small military roofs & observation sheds
    ctx.fillStyle = '#292524';
    const buildings = [
      { x: 40, w: 55, h: 32 },
      { x: 140, w: 70, h: 42 },
      { x: 260, w: 48, h: 28 },
      { x: 370, w: 65, h: 36 },
    ];

    for (const b of buildings) {
      const bx = ((b.x - this.hillScroll * 1.4) % this.width + this.width) % this.width;
      // Building base
      ctx.fillRect(bx, baseY - b.h, b.w, b.h);
      // Roof
      ctx.fillStyle = '#7f1d1d'; // Red metal corrugated roof
      ctx.beginPath();
      ctx.moveTo(bx - 4, baseY - b.h);
      ctx.lineTo(bx + b.w / 2, baseY - b.h - 10);
      ctx.lineTo(bx + b.w + 4, baseY - b.h);
      ctx.closePath();
      ctx.fill();

      // Peeking rival hen / chicken spectator in Pochinki!
      this.drawPeekingHen(ctx, bx + b.w * 0.5, baseY - b.h - 11);
      ctx.fillStyle = '#292524';
    }

    ctx.restore();
  }

  private drawPeekingHen(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Little funny hen cheering Punju from the rooftop!
    ctx.save();
    ctx.fillStyle = '#fef08a'; // White/yellow hen
    ctx.beginPath();
    ctx.arc(x, y - 6, 6, 0, Math.PI * 2);
    ctx.fill();

    // Little Level 1 helmet or headband
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.arc(x, y - 8, 5, Math.PI, Math.PI * 2);
    ctx.fill();

    // Tiny orange beak
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(x + 5, y - 6);
    ctx.lineTo(x + 10, y - 4);
    ctx.lineTo(x + 5, y - 2);
    ctx.fill();

    ctx.restore();
  }

  private drawGround(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const groundY = this.height * 0.85;
    const groundHeight = this.height - groundY;

    // Trench Dirt
    const dirtGrad = ctx.createLinearGradient(0, groundY, 0, this.height);
    dirtGrad.addColorStop(0, '#57534e'); // Trench concrete & dark mud
    dirtGrad.addColorStop(0.3, '#44403c');
    dirtGrad.addColorStop(1, '#1c1917');

    ctx.fillStyle = dirtGrad;
    ctx.fillRect(0, groundY, this.width, groundHeight);

    // Hazard yellow/black stripe on edge of battlefield
    const stripeWidth = 20;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, groundY, this.width, 10);
    ctx.clip();

    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, groundY, this.width, 10);

    ctx.fillStyle = '#18181b';
    for (let x = -stripeWidth + this.groundScroll; x < this.width + stripeWidth; x += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 10);
      ctx.lineTo(x + stripeWidth, groundY + 10);
      ctx.lineTo(x + stripeWidth + 10, groundY);
      ctx.lineTo(x + 10, groundY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Military Barbed Wire along the ground
    ctx.strokeStyle = '#a8a29e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < this.width; x += 15) {
      const yOffset = Math.sin((x + this.groundScroll) * 0.3) * 3;
      ctx.lineTo(x, groundY - 4 + yOffset);
    }
    ctx.stroke();

    // Wooden fence posts
    ctx.fillStyle = '#78350f';
    for (let x = 0; x < this.width + 40; x += 40) {
      const px = ((x - this.groundScroll) % (this.width + 40));
      ctx.fillRect(px, groundY - 14, 4, 16);
    }

    ctx.restore();
  }
}
