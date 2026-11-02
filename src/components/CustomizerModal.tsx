import React, { useState, useRef } from 'react';
import { X, Upload, Play, CheckCircle, HelpCircle, Eye, RefreshCw, Music } from 'lucide-react';
import { audioManager, SoundEffect } from '../game/audio';

interface CustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomSpriteLoaded: (url: string) => void;
  onResetDefaultSprite: () => void;
  debugHitbox: boolean;
  onToggleDebugHitbox: () => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  isOpen,
  onClose,
  onCustomSpriteLoaded,
  onResetDefaultSprite,
  debugHitbox,
  onToggleDebugHitbox,
}) => {
  const [characterPreview, setCharacterPreview] = useState<string | null>(null);
  const [uploadedSounds, setUploadedSounds] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'character' | 'sounds' | 'guide'>('character');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCharacterPreview(url);
      onCustomSpriteLoaded(url);
    }
  };

  const handleSoundUpload = (type: SoundEffect | 'bgm', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      audioManager.setCustomAudio(type, url);
      setUploadedSounds((prev) => ({ ...prev, [type]: true }));
      // Play a quick test
      if (type !== 'bgm') {
        audioManager.play(type as SoundEffect);
      }
    }
  };

  const handleTestSound = (effect: SoundEffect) => {
    audioManager.play(effect);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-amber-500/40 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div>
            <h3 className="font-['Black_Ops_One',sans-serif] text-xl text-amber-400 tracking-wide">
              CUSTOMIZER STUDIO
            </h3>
            <p className="text-zinc-400 text-xs">Swap characters & sounds for your Vercel deployment</p>
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
            className={`py-3 text-center transition-colors border-b-2 ${
              activeTab === 'character'
                ? 'border-amber-400 text-amber-400 bg-zinc-900/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🐓 Character Sprite
          </button>
          <button
            onClick={() => setActiveTab('sounds')}
            className={`py-3 text-center transition-colors border-b-2 ${
              activeTab === 'sounds'
                ? 'border-amber-400 text-amber-400 bg-zinc-900/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🎵 Custom Sounds
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 text-center transition-colors border-b-2 ${
              activeTab === 'guide'
                ? 'border-amber-400 text-amber-400 bg-zinc-900/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🚀 Vercel / GitHub
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* TAB 1: CHARACTER SPRITE */}
          {activeTab === 'character' && (
            <div className="space-y-4">
              <div className="bg-zinc-800/40 border border-zinc-700/60 rounded-xl p-4 flex items-center justify-center flex-col">
                <div className="relative w-28 h-28 bg-zinc-900 border-2 border-dashed border-amber-500/50 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
                  {characterPreview ? (
                    <img
                      src={characterPreview}
                      alt="Custom Punju"
                      className="w-20 h-20 object-contain animate-bounce"
                    />
                  ) : (
                    <img
                      src={`${import.meta.env.BASE_URL || '/'}assets/character.svg`}
                      alt="Default Punju"
                      className="w-20 h-20 object-contain animate-bounce"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div className="mt-3 text-center">
                  <span className="text-zinc-300 font-semibold text-xs">
                    {characterPreview ? 'Custom Sprite Active' : 'Default Battle Punju Active'}
                  </span>
                </div>
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
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-md active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Image</span>
                </button>

                <button
                  onClick={() => {
                    setCharacterPreview(null);
                    onResetDefaultSprite();
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all border border-zinc-700 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset Default</span>
                </button>
              </div>

              {/* Hitbox Debug Toggle */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-zinc-200">Show Collision Hitbox</div>
                  <div className="text-[11px] text-zinc-400">Green circle to verify your character's boundaries</div>
                </div>
                <button
                  onClick={onToggleDebugHitbox}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    debugHitbox
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 inline mr-1" />
                  {debugHitbox ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SOUND EFFECTS */}
          {activeTab === 'sounds' && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-xs">
                Test built-in synth sounds or upload custom MP3 files to preview:
              </p>

              {[
                { key: 'flap', name: 'Flap / Jump', desc: 'rooster flutter / whoosh' },
                { key: 'point', name: 'Pass Obstacle / Point', desc: 'PUBG golden coin chime' },
                { key: 'hit', name: 'Hit Obstacle / Frying Pan', desc: 'classic pan CLANG' },
                { key: 'powerup', name: 'Power-up Pickup', desc: 'Airdrop flare siren' },
                { key: 'rage', name: 'Rage Mode / Flare Gun', desc: 'Balayya mass blast' },
              ].map((s) => (
                <div
                  key={s.key}
                  className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                      <span>{s.name}</span>
                      {uploadedSounds[s.key] && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">public/assets/sounds/{s.key}.mp3</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestSound(s.key as SoundEffect)}
                      className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-amber-400 transition-colors"
                      title="Play Sound"
                    >
                      <Play className="w-3.5 h-3.5 fill-amber-400" />
                    </button>

                    <label className="cursor-pointer px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-zinc-700">
                      <Upload className="w-3 h-3" />
                      <span>Test MP3</span>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => handleSoundUpload(s.key as SoundEffect, e)}
                      />
                    </label>
                  </div>
                </div>
              ))}

              {/* Background Music Slot */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 flex items-center justify-between mt-2">
                <div>
                  <div className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-amber-400" />
                    <span>Battle Background Music (BGM)</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">public/assets/sounds/bgm.mp3</div>
                </div>

                <label className="cursor-pointer px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-zinc-700">
                  <Upload className="w-3 h-3" />
                  <span>Test BGM</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleSoundUpload('bgm', e)}
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: VERCEL & GITHUB DEPLOYMENT GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3">
                <div className="font-bold text-amber-400 flex items-center gap-1.5 mb-1 text-sm">
                  <HelpCircle className="w-4 h-4" />
                  <span>How to Permanently Replace Assets</span>
                </div>
                <p className="text-zinc-300">
                  When you upload files above, they work immediately in your browser. To make them permanent for your live Vercel link:
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-zinc-200">1. Replace Character:</div>
                <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 font-mono text-[11px] text-amber-300">
                  public/assets/character.png
                </div>
                <p className="text-zinc-400">
                  Save your desired Punju / Balayya PNG image into this path in your repository.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-zinc-200">2. Replace Custom Sounds:</div>
                <p className="text-zinc-400">
                  Drop your MP3 files into <code className="text-amber-300 font-mono">public/assets/sounds/</code>:
                </p>
                <ul className="list-disc list-inside space-y-1 text-zinc-400 font-mono text-[11px]">
                  <li>flap.mp3 (wing flap / Balayya dialogue)</li>
                  <li>hit.mp3 (collision sound)</li>
                  <li>point.mp3 (score chime)</li>
                  <li>powerup.mp3 (airdrop sound)</li>
                  <li>bgm.mp3 (looping music)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-zinc-200">3. Push to GitHub & Deploy to Vercel:</div>
                <pre className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                  git add .&#10;git commit -m "Update custom Punju character & sounds"&#10;git push origin main
                </pre>
                <p className="text-zinc-400">
                  Vercel will automatically rebuild and deploy your updated game in seconds!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};
