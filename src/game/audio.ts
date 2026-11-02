/**
 * Dual-Mode Audio Engine for Flying Punju
 * Features:
 * 1. Zero-dependency Web Audio API procedural synthesizer (never fails, 0 missing file errors)
 * 2. Custom MP3 / Audio File loader (plays user's sounds if present)
 * 3. In-game dynamic audio swapping & volume persistence
 */

export type SoundEffect =
  | 'start'
  | 'flap'
  | 'point'
  | 'nearMiss'
  | 'powerup'
  | 'shieldBreak'
  | 'rage'
  | 'hit'
  | 'gameover'
  | 'winner';

class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private customSounds: Partial<Record<SoundEffect, HTMLAudioElement>> = {};
  private customBgm: HTMLAudioElement | null = null;
  private isBgmPlaying: boolean = false;

  constructor() {
    // Load mute state from localStorage
    try {
      const savedMute = localStorage.getItem('flying_punju_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
      const savedVol = localStorage.getItem('flying_punju_vol');
      if (savedVol !== null) {
        this.volume = parseFloat(savedVol) || 0.8;
      }
    } catch {
      // Ignore localStorage failure in restricted contexts
    }

    this.attemptLoadDefaultCustomSounds();
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Attempt to preload custom MP3s from public/assets/sounds/
  private attemptLoadDefaultCustomSounds() {
    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') + '/';
    const soundFiles: Record<string, SoundEffect> = {
      [`${baseUrl}assets/sounds/start.mp3`]: 'start',
      [`${baseUrl}assets/sounds/flap.mp3`]: 'flap',
      [`${baseUrl}assets/sounds/point.mp3`]: 'point',
      [`${baseUrl}assets/sounds/hit.mp3`]: 'hit',
      [`${baseUrl}assets/sounds/powerup.mp3`]: 'powerup',
      [`${baseUrl}assets/sounds/rage.mp3`]: 'rage',
      [`${baseUrl}assets/sounds/gameover.mp3`]: 'gameover',
    };

    Object.entries(soundFiles).forEach(([url, key]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.oncanplaythrough = () => {
        this.customSounds[key] = audio;
      };
      audio.onerror = () => {
        // Custom sound not found, will smoothly fall back to Web Audio synth
      };
    });

    const bgm = new Audio(`${baseUrl}assets/sounds/bgm.mp3`);
    bgm.loop = true;
    bgm.oncanplaythrough = () => {
      this.customBgm = bgm;
    };
    bgm.onerror = () => {
      this.customBgm = null;
    };
  }

  /**
   * Set custom sound dynamically (e.g. from File Uploader / Live Customizer)
   */
  public setCustomAudio(type: SoundEffect | 'bgm', sourceUrl: string) {
    if (type === 'bgm') {
      if (this.customBgm) {
        this.customBgm.pause();
      }
      const bgm = new Audio(sourceUrl);
      bgm.loop = true;
      bgm.volume = this.volume * 0.5;
      this.customBgm = bgm;
      if (this.isBgmPlaying && !this.isMuted) {
        bgm.play().catch(() => {});
      }
      return;
    }

    const audio = new Audio(sourceUrl);
    audio.preload = 'auto';
    this.customSounds[type] = audio;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('flying_punju_muted', String(this.isMuted));
    } catch {
      // Ignore
    }

    if (this.customBgm) {
      if (this.isMuted) {
        this.customBgm.pause();
      } else if (this.isBgmPlaying) {
        this.customBgm.play().catch(() => {});
      }
    }

    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('flying_punju_vol', String(this.volume));
    } catch {
      // Ignore
    }
    if (this.customBgm) {
      this.customBgm.volume = this.volume * 0.5;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public startBGM() {
    this.isBgmPlaying = true;
    if (this.customBgm && !this.isMuted) {
      this.customBgm.volume = this.volume * 0.5;
      this.customBgm.play().catch(() => {});
    }
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.customBgm) {
      this.customBgm.pause();
      this.customBgm.currentTime = 0;
    }
  }

  /**
   * Play any game sound effect
   */
  public play(effect: SoundEffect) {
    if (this.isMuted) return;
    try {
      this.initContext();

      // Check if a custom audio element exists and is loaded
      const custom = this.customSounds[effect];
      if (custom) {
        try {
          const clone = custom.cloneNode(true) as HTMLAudioElement;
          clone.volume = this.volume;
          clone.play().catch(() => {
            // Fallback to synth if play promise is rejected
            this.playSynthesized(effect);
          });
          return;
        } catch {
          // Fallback to synth
        }
      }

      // Default: Procedural Web Audio Synth
      this.playSynthesized(effect);
    } catch (e) {
      console.warn('Audio playback safely skipped:', e);
    }
  }

  /**
   * Procedural Web Audio Synthesizer (Zero asset dependency)
   */
  private playSynthesized(effect: SoundEffect) {
    try {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(this.ctx.destination);

      switch (effect) {
      case 'start': {
        // Dramatic battlefield horn fanfare + Rooster crow opening sound
        const freqs = [196, 261.63, 329.63, 392, 523.25];
        freqs.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + idx * 0.08 + 0.2);

          gain.gain.setValueAtTime(0.24, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.3);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.3);
        });

        // Rooster crow overtone
        const crow = this.ctx.createOscillator();
        const crowGain = this.ctx.createGain();
        crow.type = 'triangle';
        crow.frequency.setValueAtTime(450, now + 0.35);
        crow.frequency.exponentialRampToValueAtTime(800, now + 0.5);
        crow.frequency.exponentialRampToValueAtTime(350, now + 0.75);

        crowGain.gain.setValueAtTime(0.3, now + 0.35);
        crowGain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

        crow.connect(crowGain);
        crowGain.connect(masterGain);
        crow.start(now + 0.35);
        crow.stop(now + 0.75);
        break;
      }

      case 'flap': {
        // Quick rooster wing whoosh + cluck pitch bend
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.16);
        break;
      }

      case 'point': {
        // Bright golden chime (two harmonic tones)
        [880, 1320].forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          gain.gain.setValueAtTime(0.25, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.25);
        });
        break;
      }

      case 'nearMiss': {
        // Balayya mass style whoosh & cinematic pulse
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.18);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'powerup': {
        // PUBG Airdrop flare siren / ascending arpeggio
        const freqs = [350, 440, 554, 659, 880];
        freqs.forEach((f, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(f, now + i * 0.06);

          gain.gain.setValueAtTime(0.18, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.1);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.1);
        });
        break;
      }

      case 'shieldBreak': {
        // Metallic armor shatter (PUBG Level 3 helmet breaking)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.3);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case 'rage': {
        // Energetic overdrive blast
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.4);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.02, now + 0.45);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }

      case 'hit': {
        // Classic PUBG Frying Pan "CLANG!"
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }

      case 'gameover': {
        // Low battlefield explosion rumble
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 0.6);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.65);
        break;
      }

      case 'winner': {
        // Winner Winner Chicken Dinner victory trumpet notes
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0.28, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.35);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.35);
        });
        break;
      }
    }
    } catch (e) {
      console.warn('Synth playback caught error:', e);
    }
  }
}

export const audioManager = new AudioManager();
