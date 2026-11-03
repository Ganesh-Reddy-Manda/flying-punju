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
  private customGameOverSounds: HTMLAudioElement[] = [];
  private customBgm: HTMLAudioElement | null = null;
  private isBgmPlaying: boolean = false;
  private isBgmPaused: boolean = false;
  private bgmSynthTimer: number | null = null;
  private bgmSynthStep: number = 0;
  private pauseTimeoutId: number | null = null;

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

    const loadSingleAudio = (url: string, key?: SoundEffect, isGameOver: boolean = false) => {
      const audio = new Audio();
      audio.preload = 'auto';

      let registered = false;
      const registerAudio = () => {
        if (registered) return;
        registered = true;
        if (key) {
          this.customSounds[key] = audio;
        }
        if (isGameOver) {
          if (!this.customGameOverSounds.some((a) => a.src === audio.src)) {
            this.customGameOverSounds.push(audio);
          }
          if (!this.customSounds['gameover']) {
            this.customSounds['gameover'] = audio;
          }
        }
      };

      audio.addEventListener('canplay', registerAudio);
      audio.addEventListener('canplaythrough', registerAudio);
      audio.addEventListener('loadeddata', registerAudio);
      audio.addEventListener('loadedmetadata', registerAudio);
      audio.src = url;
      audio.load();

      // Also probe via fetch to register immediately upon HTTP 200 OK
      try {
        fetch(url, { method: 'HEAD' })
          .then((res) => {
            if (res.ok && res.status === 200) {
              registerAudio();
            }
          })
          .catch(() => {});
      } catch {
        // Ignore
      }
    };

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
      loadSingleAudio(url, key, key === 'gameover');
    });

    // Check for multiple numbered Game Over files: gameover1.mp3 through gameover10.mp3
    for (let i = 1; i <= 10; i++) {
      const gUrl = `${baseUrl}assets/sounds/gameover${i}.mp3`;
      loadSingleAudio(gUrl, undefined, true);
    }

    const bgmUrl = `${baseUrl}assets/sounds/bgm.mp3`;
    const bgm = new Audio();
    bgm.preload = 'auto';
    bgm.loop = true;
    const registerBgm = () => {
      this.customBgm = bgm;
    };
    bgm.addEventListener('canplay', registerBgm);
    bgm.addEventListener('canplaythrough', registerBgm);
    bgm.addEventListener('loadeddata', registerBgm);
    bgm.src = bgmUrl;
    bgm.load();
    try {
      fetch(bgmUrl, { method: 'HEAD' })
        .then((res) => {
          if (res.ok && res.status === 200) {
            registerBgm();
          }
        })
        .catch(() => {});
    } catch {
      // Ignore
    }
  }

  /**
   * Set custom sound dynamically (e.g. from File Uploader / Live Customizer)
   */
  public setCustomAudio(type: SoundEffect | 'bgm', sourceUrl: string) {
    if (type === 'bgm') {
      if (this.customBgm) {
        this.customBgm.pause();
      }
      this.stopProceduralBGM();
      const bgm = new Audio(sourceUrl);
      bgm.loop = true;
      bgm.volume = this.volume * 0.5;
      this.customBgm = bgm;
      if (this.isBgmPlaying && !this.isMuted && !this.isBgmPaused) {
        bgm.play().catch(() => {});
      }
      return;
    }

    if (type === 'gameover') {
      this.addCustomGameOverAudio(sourceUrl);
      return;
    }

    const audio = new Audio(sourceUrl);
    audio.preload = 'auto';
    this.customSounds[type] = audio;
  }

  /**
   * Add a custom Game Over audio clip to the random pool
   */
  public addCustomGameOverAudio(sourceUrl: string) {
    const audio = new Audio(sourceUrl);
    audio.preload = 'auto';
    this.customGameOverSounds.push(audio);
    this.customSounds['gameover'] = audio;
  }

  public getGameOverSoundsCount(): number {
    return this.customGameOverSounds.length;
  }

  public clearCustomGameOverAudios() {
    this.customGameOverSounds = [];
    delete this.customSounds['gameover'];
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('flying_punju_muted', String(this.isMuted));
    } catch {
      // Ignore
    }

    if (this.isMuted) {
      if (this.customBgm) {
        this.customBgm.pause();
      }
      this.stopProceduralBGM();
    } else if (this.isBgmPlaying && !this.isBgmPaused) {
      if (this.customBgm) {
        this.customBgm.play().catch(() => {});
      } else {
        this.startProceduralBGM();
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
    this.isBgmPaused = false;
    this.initContext();

    if (this.customBgm && !this.isMuted) {
      this.customBgm.volume = this.volume * 0.5;
      this.customBgm.play().catch(() => {
        // Fallback to procedural synth BGM if custom file playback blocks
        this.startProceduralBGM();
      });
    } else if (!this.isMuted) {
      this.startProceduralBGM();
    }
  }

  public pauseBGM() {
    this.isBgmPaused = true;
    if (this.customBgm && !this.customBgm.paused) {
      this.customBgm.pause();
    }
  }

  public resumeBGM() {
    if (this.isMuted || !this.isBgmPlaying) return;
    this.isBgmPaused = false;
    this.initContext();

    if (this.customBgm) {
      this.customBgm.volume = this.volume * 0.5;
      this.customBgm.play().catch(() => {
        this.startProceduralBGM();
      });
    } else if (this.bgmSynthTimer === null) {
      this.startProceduralBGM();
    }
  }

  public stopBGM() {
    if (this.pauseTimeoutId !== null) {
      clearTimeout(this.pauseTimeoutId);
      this.pauseTimeoutId = null;
    }
    this.isBgmPlaying = false;
    this.isBgmPaused = false;
    if (this.customBgm) {
      this.customBgm.pause();
      this.customBgm.currentTime = 0;
    }
    this.stopProceduralBGM();
  }

  /**
   * Play collision / hit sound with background music paused,
   * then automatically resume background music AFTER the sound completely finishes!
   */
  public playHitWithBGMPause(effect: SoundEffect = 'hit', fallbackDelayMs: number = 1300) {
    if (this.pauseTimeoutId !== null) {
      clearTimeout(this.pauseTimeoutId);
      this.pauseTimeoutId = null;
    }

    // 1. Immediately pause background music so the hit/dialogue sound is loud and clear!
    this.pauseBGM();

    let hasResumed = false;
    const resumeOnce = () => {
      if (hasResumed) return;
      hasResumed = true;
      if (this.pauseTimeoutId !== null) {
        clearTimeout(this.pauseTimeoutId);
        this.pauseTimeoutId = null;
      }
      // ONLY resume if the match is still actively PLAYING (never resume on game over)!
      if (this.isBgmPlaying && this.isBgmPaused && !this.isMuted) {
        this.resumeBGM();
      }
    };

    // 2. Play the sound and hook its onended callback
    this.play(effect, () => {
      resumeOnce();
    });

    // 3. Fallback safety timer in case onended doesn't fire
    const custom = this.customSounds[effect];
    const estimatedDur = (custom && custom.duration && !isNaN(custom.duration) && custom.duration > 0)
      ? (custom.duration * 1000) + 150
      : fallbackDelayMs;

    this.pauseTimeoutId = window.setTimeout(() => {
      resumeOnce();
    }, estimatedDur);
  }

  /**
   * Procedural Battle BGM (16-step rhythmic synth loop when no bgm.mp3 is loaded)
   */
  private startProceduralBGM() {
    this.stopProceduralBGM();
    this.bgmSynthStep = 0;
    const stepDurationMs = 125; // 120 BPM 16th notes

    this.bgmSynthTimer = window.setInterval(() => {
      if (this.isMuted || !this.isBgmPlaying || this.isBgmPaused) return;
      this.playSynthBgmStep(this.bgmSynthStep);
      this.bgmSynthStep = (this.bgmSynthStep + 1) % 16;
    }, stepDurationMs);
  }

  private stopProceduralBGM() {
    if (this.bgmSynthTimer !== null) {
      clearInterval(this.bgmSynthTimer);
      this.bgmSynthTimer = null;
    }
  }

  private playSynthBgmStep(step: number) {
    if (!this.ctx || this.isMuted || this.isBgmPaused) return;
    try {
      const now = this.ctx.currentTime;
      const bgmVol = this.volume * 0.28; // balanced background volume

      // 1. Rhythmic bass pulse
      const bassNotes = [
        110, 0, 0, 110,  // A2
        0, 0, 130.81, 0, // C3
        98, 0, 110, 0,   // G2, A2
        82.41, 0, 110, 0 // E2, A2
      ];
      const bassFreq = bassNotes[step];
      if (bassFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bassFreq, now);

        gain.gain.setValueAtTime(bgmVol * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      }

      // 2. Hi-hat / Percussion tick on even steps (2, 6, 10, 14)
      if (step === 2 || step === 6 || step === 10 || step === 14) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(step === 6 || step === 14 ? 1100 : 2200, now);

        gain.gain.setValueAtTime(bgmVol * 0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      }

      // 3. Ambient Synth Arpeggio on quarter notes (0, 4, 8, 12)
      if (step % 4 === 0) {
        const chordNotes = [220, 261.63, 329.63, 392]; // Am7
        const noteFreq = chordNotes[(step / 4) % chordNotes.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(noteFreq, now);

        gain.gain.setValueAtTime(bgmVol * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch {
      // Ignore background audio step error
    }
  }

  /**
   * Play any game sound effect
   */
  public play(effect: SoundEffect, onEnded?: () => void) {
    if (this.isMuted) {
      if (onEnded) onEnded();
      return;
    }
    try {
      this.initContext();

      // If effect is gameover and multiple custom audios exist, randomly select one every time!
      let custom = this.customSounds[effect];
      if (effect === 'gameover' && this.customGameOverSounds.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.customGameOverSounds.length);
        custom = this.customGameOverSounds[randomIndex];
      }

      if (custom) {
        try {
          const clone = custom.cloneNode(true) as HTMLAudioElement;
          clone.volume = this.volume;
          let endedFired = false;
          const fireEndedOnce = () => {
            if (!endedFired) {
              endedFired = true;
              if (onEnded) onEnded();
            }
          };

          if (onEnded) {
            clone.onended = fireEndedOnce;
            clone.onerror = fireEndedOnce;
          }

          clone.play().then(() => {
            // Safety backup timer if clone.duration is valid
            if (onEnded && clone.duration && !isNaN(clone.duration) && clone.duration > 0) {
              setTimeout(fireEndedOnce, (clone.duration * 1000) + 120);
            }
          }).catch(() => {
            // Fallback to synth if play promise is rejected
            this.playSynthesized(effect, onEnded);
          });
          return;
        } catch {
          // Fallback to synth
        }
      }

      // Default: Procedural Web Audio Synth
      this.playSynthesized(effect, onEnded);
    } catch (e) {
      console.warn('Audio playback safely skipped:', e);
      if (onEnded) onEnded();
    }
  }

  /**
   * Procedural Web Audio Synthesizer (Zero asset dependency)
   */
  private playSynthesized(effect: SoundEffect, onEnded?: () => void) {
    try {
      if (!this.ctx || this.isMuted) {
        if (onEnded) onEnded();
        return;
      }
      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(this.ctx.destination);

      if (onEnded) {
        const synthDurations: Record<SoundEffect, number> = {
          start: 800,
          flap: 180,
          point: 320,
          nearMiss: 280,
          powerup: 450,
          shieldBreak: 350,
          rage: 480,
          hit: 420,
          gameover: 700,
          winner: 850,
        };
        const dur = synthDurations[effect] || 400;
        setTimeout(onEnded, dur);
      }
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
        // Randomly pick 1 of 3 comedic / dramatic defeat synth sound profiles!
        const variant = Math.floor(Math.random() * 3);

        if (variant === 0) {
          // Low battlefield explosion rumble with sub-bass drop
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(28, now + 0.65);

          gain.gain.setValueAtTime(0.55, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.7);
        } else if (variant === 1) {
          // Sliding comedic trombone defeat ("Wah wah wah waaaah")
          const notes = [311.13, 293.66, 277.18, 261.63]; // Eb4, D4, Db4, C4
          notes.forEach((freq, idx) => {
            if (!this.ctx) return;
            const t = now + idx * 0.17;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t);
            if (idx === 3) {
              osc.frequency.linearRampToValueAtTime(freq * 0.7, t + 0.45);
            }

            gain.gain.setValueAtTime(0.32, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + (idx === 3 ? 0.5 : 0.15));

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(t);
            osc.stop(t + (idx === 3 ? 0.5 : 0.15));
          });
        } else {
          // Rooster distress squawk + metal clash
          const crow = this.ctx.createOscillator();
          const crowGain = this.ctx.createGain();
          crow.type = 'sawtooth';
          crow.frequency.setValueAtTime(620, now);
          crow.frequency.exponentialRampToValueAtTime(170, now + 0.38);

          crowGain.gain.setValueAtTime(0.42, now);
          crowGain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);

          crow.connect(crowGain);
          crowGain.connect(masterGain);
          crow.start(now);
          crow.stop(now + 0.42);

          const rumble = this.ctx.createOscillator();
          const rGain = this.ctx.createGain();
          rumble.type = 'triangle';
          rumble.frequency.setValueAtTime(180, now + 0.08);
          rumble.frequency.exponentialRampToValueAtTime(45, now + 0.6);
          rGain.gain.setValueAtTime(0.4, now + 0.08);
          rGain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
          rumble.connect(rGain);
          rGain.connect(masterGain);
          rumble.start(now + 0.08);
          rumble.stop(now + 0.65);
        }
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
