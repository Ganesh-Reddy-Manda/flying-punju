export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation?: number;
  vRot?: number;
  type: 'feather' | 'spark' | 'smoke' | 'fire' | 'text';
  text?: string;
  textColor?: string;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * (dt * 60);
      p.y += p.vy * (dt * 60);

      if (p.rotation !== undefined && p.vRot !== undefined) {
        p.rotation += p.vRot * (dt * 60);
      }

      // Physics based on type
      if (p.type === 'feather') {
        p.vy += 0.08 * (dt * 60); // gentle flutter gravity
        p.vx *= 0.98;
        if (p.rotation !== undefined) {
          p.x += Math.sin(p.rotation * 2) * 0.4;
        }
      } else if (p.type === 'fire') {
        p.size *= 0.96;
        p.vy -= 0.05 * (dt * 60); // rise up
      } else if (p.type === 'smoke') {
        p.size *= 1.02; // expand
        p.vy -= 0.02 * (dt * 60);
      } else if (p.type === 'text') {
        p.vy *= 0.95; // slow down rising text
      }

      p.alpha = Math.max(0, p.life / p.maxLife);
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;

      if (p.type === 'text' && p.text) {
        ctx.font = '900 18px "Montserrat", "Black Ops One", sans-serif';
        ctx.fillStyle = p.textColor || '#facc15';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.type === 'feather') {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.rotation !== undefined) ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        // Draw little curved feather
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Feather burst when Punju flaps
  public spawnFeathers(x: number, y: number, count: number = 4) {
    const colors = ['#f59e0b', '#ef4444', '#b45309', '#fbbf24', '#ffffff'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x - 10 + (Math.random() * 8 - 4),
        y: y + 10 + (Math.random() * 8 - 4),
        vx: -1.5 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 5 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.15,
        type: 'feather',
      });
    }
  }

  // Rage mode fiery trail
  public spawnRageTrail(x: number, y: number) {
    const colors = ['#ef4444', '#f97316', '#eab308'];
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: x - 20,
        y: y + (Math.random() * 14 - 7),
        vx: -3 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 8 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.9,
        life: 0.35,
        maxLife: 0.35,
        type: 'fire',
      });
    }
  }

  // Armor smash / Obstacle shatter explosion
  public spawnExplosion(x: number, y: number, color: string = '#facc15', count: number = 18) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        type: 'spark',
      });
    }
  }

  // Floating score or meme popup
  public spawnFloatingText(x: number, y: number, text: string, color: string = '#facc15') {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: -1.8,
      size: 16,
      color: '#000',
      alpha: 1,
      life: 1.1,
      maxLife: 1.1,
      type: 'text',
      text,
      textColor: color,
    });
  }

  public clear() {
    this.particles = [];
  }
}
