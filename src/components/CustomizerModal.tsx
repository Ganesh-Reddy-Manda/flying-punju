import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Play, CheckCircle, RefreshCw, Music, Shield, Zap, Flame, Award, Crosshair, ZoomIn } from 'lucide-react';
import { audioManager, SoundEffect } from '../game/audio';

interface CustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomSpriteLoaded: (url: string) => void;
  onResetDefaultSprite: () => void;
  debugHitbox?: boolean;
  onToggleDebugHitbox?: () => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  isOpen,
  onClose,
  onCustomSpriteLoaded,
  onResetDefaultSprite,
}) => {
  const [activeTab, setActiveTab] = useState<'character' | 'sounds' | 'powers'>('character');
  
  // Image & Circular Cropper State
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cropSuccess, setCropSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Handle Raw Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRawImageSrc(url);
      setZoomScale(1.0);
      setPanOffset({ x: 0, y: 0 });

      const img = new Image();
      img.src = url;
      img.onload = () => {
        imageObjRef.current = img;
        generateAndApplyCroppedSprite(img, 1.0, 0, 0);
      };
    }
  };

  // Re-render the interactive cropper canvas with green line
  const renderCropperCanvas = () => {
    const canvas = cropCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = 54; // Green circular hitbox preview

    ctx.clearRect(0, 0, w, h);

    // 1. Dark checkboard or background
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, w, h);

    // 2. Draw user's image if present, or default battle rooster
    if (imageObjRef.current) {
      const img = imageObjRef.current;
      const aspect = img.width / img.height;
      let drawW = radius * 2.2 * zoomScale;
      let drawH = drawW / aspect;

      ctx.save();
      ctx.drawImage(
        img,
        cx - drawW / 2 + panOffset.x,
        cy - drawH / 2 + panOffset.y,
        drawW,
        drawH
      );
      ctx.restore();
    } else {
      // Guide icon if no image uploaded yet
      ctx.fillStyle = '#71717a';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Main Hero', cx, cy - 8);
      ctx.fillText('(Upload to customize)', cx, cy + 10);
    }

    // 3. Dark mask outside the green circular boundary
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.arc(cx, cy, radius, 0, Math.PI * 2, true); // subtract circle
    ctx.fill();

    // 4. Bright Glowing Green Hitbox Guideline Line
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    ctx.restore();
  };

  // Generate clean circular cropped PNG data URL (everything outside green line is transparent)
  const generateAndApplyCroppedSprite = (
    img: HTMLImageElement,
    scale: number,
    offX: number,
    offY: number
  ) => {
    const offscreen = document.createElement('canvas');
    const size = 120;
    offscreen.width = size;
    offscreen.height = size;
    const octx = offscreen.getContext('2d');
    if (!octx) return;

    const cx = size / 2;
    const cy = size / 2;
    const radius = 54;

    // Circular clipping mask: guarantees 100% transparency outside green line
    octx.beginPath();
    octx.arc(cx, cy, radius, 0, Math.PI * 2);
    octx.closePath();
    octx.clip();

    const aspect = img.width / img.height;
    let drawW = radius * 2.2 * scale;
    let drawH = drawW / aspect;

    octx.drawImage(img, cx - drawW / 2 + offX, cy - drawH / 2 + offY, drawW, drawH);

    const croppedDataUrl = offscreen.toDataURL('image/png');
    onCustomSpriteLoaded(croppedDataUrl);
    setCropSuccess(true);
    setTimeout(() => setCropSuccess(false), 2000);
  };

  useEffect(() => {
    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') + '/';
    const img = new Image();
    img.src = `${baseUrl}assets/character.png?v=${Date.now()}`;
    img.onload = () => {
      if (!imageObjRef.current) {
        imageObjRef.current = img;
        renderCropperCanvas();
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      renderCropperCanvas();
    }
  }, [isOpen, rawImageSrc, zoomScale, panOffset, activeTab]);

  // Pointer drag events for canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!imageObjRef.current) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPanOffset({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    if (isDragging && imageObjRef.current) {
      setIsDragging(false);
      generateAndApplyCroppedSprite(imageObjRef.current, zoomScale, panOffset.x, panOffset.y);
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scale = parseFloat(e.target.value);
    setZoomScale(scale);
    if (imageObjRef.current) {
      generateAndApplyCroppedSprite(imageObjRef.current, scale, panOffset.x, panOffset.y);
    }
  };

  const handleTestSound = (effect: SoundEffect) => {
    audioManager.play(effect);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-amber-500/40 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div>
            <h3 className="font-['Black_Ops_One',sans-serif] text-xl text-amber-400 tracking-wide">
              HERO & GAME GUIDE
            </h3>
            <p className="text-zinc-400 text-xs">Hero skin, active soundtrack & gameplay powers</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-zinc-800 bg-zinc-950 text-xs font-bold">
          <button
            onClick={() => setActiveTab('character')}
            className={`py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'character'
                ? 'border-amber-400 text-amber-400 bg-zinc-900/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Hero Skin</span>
          </button>
          <button
            onClick={() => setActiveTab('sounds')}
            className={`py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'sounds'
                ? 'border-amber-400 text-amber-400 bg-zinc-900/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Soundtrack</span>
          </button>
          <button
            onClick={() => setActiveTab('powers')}
            className={`py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'powers'
                ? 'border-amber-400 text-amber-400 bg-zinc-900/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>How to Play & Powers</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* TAB 1: CHARACTER CROPPER WITH GREEN HITBOX GUIDELINE */}
          {activeTab === 'character' && (
            <div className="space-y-4">
              {/* Interactive Cropper Box */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-zinc-300 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping inline-block" />
                    Green Line Hitbox Preview
                  </span>
                  {cropSuccess && (
                    <span className="text-green-400 text-[11px] font-bold animate-pulse">
                      ✓ Auto-Cropped to Circle!
                    </span>
                  )}
                </div>

                {/* Canvas Cropper */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-zinc-700/80 shadow-2xl cursor-grab active:cursor-grabbing">
                  <canvas
                    ref={cropCanvasRef}
                    width={180}
                    height={180}
                    className="touch-none select-none block bg-zinc-950"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  />
                </div>

                <p className="text-[11px] text-zinc-400 text-center mt-2">
                  <b className="text-green-400">Green Circle:</b> Only what's inside is used. Everything outside is automatically cropped with <b>zero disturbance</b>!
                </p>

                {/* Zoom & Drag Controls */}
                {rawImageSrc && (
                  <div className="w-full mt-3 space-y-2 bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center justify-between text-xs text-zinc-300">
                      <span className="flex items-center gap-1 font-semibold">
                        <ZoomIn className="w-3.5 h-3.5 text-amber-400" /> Zoom / Scale:
                      </span>
                      <span className="font-mono text-amber-400">{zoomScale.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.05"
                      value={zoomScale}
                      onChange={handleZoomChange}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="text-[10px] text-zinc-400 text-center">
                      (Drag image above with mouse or touch to center your character!)
                    </div>
                  </div>
                )}
              </div>

              {/* Upload & Reset Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-md active:scale-95 uppercase tracking-wide"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Character</span>
                </button>

                <button
                  onClick={() => {
                    setRawImageSrc(null);
                    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') + '/';
                    const img = new Image();
                    img.src = `${baseUrl}assets/character.png?v=${Date.now()}`;
                    img.onload = () => {
                      imageObjRef.current = img;
                      renderCropperCanvas();
                    };
                    onResetDefaultSprite();
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all border border-zinc-700 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset Hero</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SOUND EFFECTS & SOUNDTRACK */}
          {activeTab === 'sounds' && (
            <div className="space-y-3">
              {/* Active Soundtracks Overview */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-xs text-amber-400 uppercase tracking-wide">
                      Active Game Soundtrack
                    </span>
                  </div>
                  <span className="text-[11px] bg-green-500/20 text-green-400 px-2.5 py-0.5 rounded-full font-bold border border-green-500/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Ready
                  </span>
                </div>
                <p className="text-zinc-400 text-xs">
                  All custom songs and dynamic score-based defeat dialogues are loaded and active.
                </p>
              </div>

              {/* Soundtrack Elements */}
              <div className="space-y-2">
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                      <span>Battle Background Music (BGM)</span>
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <div className="text-[11px] text-zinc-400">High-energy Erangel battlefield music</div>
                  </div>
                  <button
                    onClick={() => handleTestSound('start')}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-amber-400 transition-colors"
                    title="Play Match Start Audio"
                  >
                    <Play className="w-3.5 h-3.5 fill-amber-400" />
                  </button>
                </div>

                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                      <span>Jump / Wing Flap</span>
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <div className="text-[11px] text-zinc-400">Dynamic flap sound effect</div>
                  </div>
                  <button
                    onClick={() => handleTestSound('flap')}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-amber-400 transition-colors"
                    title="Play Flap Sound"
                  >
                    <Play className="w-3.5 h-3.5 fill-amber-400" />
                  </button>
                </div>

                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                      <span>Rage Mode / Flare Gun</span>
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <div className="text-[11px] text-zinc-400">High-power rampage music & sound</div>
                  </div>
                  <button
                    onClick={() => handleTestSound('rage')}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-amber-400 transition-colors"
                    title="Play Rage Sound"
                  >
                    <Play className="w-3.5 h-3.5 fill-amber-400" />
                  </button>
                </div>
              </div>

              {/* SCORE-BASED GAME OVER DIALOGUE TIERS */}
              <div className="bg-gradient-to-r from-red-950/40 via-zinc-900/90 to-amber-950/30 border border-amber-500/40 rounded-xl p-3.5 space-y-2.5 shadow-lg mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <div>
                    <div className="font-extrabold text-xs text-amber-400">
                      Score-Based Game Over Dialogues
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Automatically selects audio based on obstacles survived:
                    </p>
                  </div>
                </div>

                {/* 4 Score Tiers */}
                <div className="space-y-2">
                  {[
                    { tier: 1, label: 'Tier 1: Low Score (< 3 passes)', desc: 'Early crash dialogue', color: 'text-red-400' },
                    { tier: 2, label: 'Tier 2: Ok-Ok Run (3 - 9 passes)', desc: 'Average survival performance', color: 'text-amber-400' },
                    { tier: 3, label: 'Tier 3: Good Run (10 - 19 passes)', desc: 'Fighter cock Pochinki performance', color: 'text-sky-400' },
                    { tier: 4, label: 'Tier 4: Champion (20+ / High Score)', desc: 'Winner Winner Chicken Dinner!', color: 'text-green-400' },
                  ].map((t) => (
                    <div
                      key={t.tier}
                      className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-2.5 flex items-center justify-between"
                    >
                      <div>
                        <div className={`font-bold text-xs flex items-center gap-1.5 ${t.color}`}>
                          <span>{t.label}</span>
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {t.desc}
                        </div>
                      </div>

                      <button
                        onClick={() => audioManager.playGameOverTierTest(t.tier)}
                        className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-amber-400 transition-colors"
                        title={`Listen to ${t.label}`}
                      >
                        <Play className="w-3 h-3 fill-amber-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HOW TO PLAY & WHAT PROVIDES WHAT POWER */}
          {activeTab === 'powers' && (
            <div className="space-y-3.5 text-xs text-zinc-300">
              {/* Core Goal */}
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3">
                <div className="font-bold text-amber-400 text-sm mb-1 flex items-center gap-1.5">
                  <span>🎯 Mission Objective</span>
                </div>
                <p className="text-zinc-200 leading-relaxed">
                  Help <b>Punju</b> survive the Erangel battleground! Dodge sniper watchtowers and flying frying pans to claim your <b>Winner Winner Chicken Dinner</b>!
                </p>
                <div className="mt-2 text-zinc-400 text-[11px]">
                  Controls: <b>Tap Screen</b>, <b>Click</b>, or press <b>SPACE / UP ARROW</b> to fly!
                </div>
              </div>

              {/* Power-up Cards */}
              <div className="space-y-2">
                {/* 1. Level 3 Helmet */}
                <div className="bg-zinc-900/90 border border-sky-500/40 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-950/80 border border-sky-400/60 flex items-center justify-center shrink-0 text-lg">
                    🪖
                  </div>
                  <div>
                    <div className="font-bold text-sky-400 text-xs flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Level 3 Spetsnaz Helmet (Life Shield)</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] mt-0.5 leading-normal">
                      Absorbs <b>1 fatal collision</b> with any tower or frying pan! The helmet shatters with metallic armor debris, grants <b>1.2s invulnerability</b>, and saves your life!
                    </p>
                  </div>
                </div>

                {/* 2. Energy Drink */}
                <div className="bg-zinc-900/90 border border-amber-500/40 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-400/60 flex items-center justify-center shrink-0 text-lg">
                    ⚡
                  </div>
                  <div>
                    <div className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>PUBG Energy Drink (2X Score & Magnet)</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] mt-0.5 leading-normal">
                      Lasts <b>8 seconds</b>. Doubles all score points from passing towers and creates an electric <b>magnetic field</b> that pulls nearby golden corn snacks straight to you!
                    </p>
                  </div>
                </div>

                {/* 3. Flare Gun */}
                <div className="bg-zinc-900/90 border border-red-500/40 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-950/80 border border-red-500 flex items-center justify-center shrink-0 text-lg">
                    🔫
                  </div>
                  <div>
                    <div className="font-bold text-red-400 text-xs flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      <span>Flare Gun / Punju Rage Mode (Invincible Smash)</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] mt-0.5 leading-normal">
                      Lasts <b>5.5 seconds</b>. Turns Punju into a fiery missile! Smashes and <b>explodes sniper towers and pans into pieces</b> on contact with awesome screen shake!
                    </p>
                  </div>
                </div>

                {/* 4. Golden Corn */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-lg">
                    🌽
                  </div>
                  <div>
                    <div className="font-bold text-yellow-300 text-xs">
                      Golden Battle Corn (+2 Points)
                    </div>
                    <p className="text-zinc-300 text-[11px] mt-0.5 leading-normal">
                      Floating grain snacks in the battleground. Collect them to rack up your score faster!
                    </p>
                  </div>
                </div>

                {/* 5. Frying Pan */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-lg">
                    🍳
                  </div>
                  <div>
                    <div className="font-bold text-zinc-200 text-xs">
                      PUBG Cast-Iron Frying Pan (Hazard)
                    </div>
                    <p className="text-zinc-400 text-[11px] mt-0.5 leading-normal">
                      Hovering bouncing obstacle in the middle of the gap. Steer clear or smash it using Flare Gun Rage!
                    </p>
                  </div>
                </div>

                {/* 6. Mass Near-Miss */}
                <div className="bg-zinc-900/90 border border-orange-500/30 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-950/80 border border-orange-500/50 flex items-center justify-center shrink-0 text-lg">
                    💥
                  </div>
                  <div>
                    <div className="font-bold text-orange-400 text-xs">
                      Balayya "MASS NEAR-MISS!" Combos
                    </div>
                    <p className="text-zinc-300 text-[11px] mt-0.5 leading-normal">
                      Glide within <b>18px</b> of obstacle edges without hitting them to trigger <b>MASS COMBO (1x to 5x)</b> and massive bonus points!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            Done / Play Game
          </button>
        </div>
      </div>
    </div>
  );
};
