# 🐓 Flying Punju: PUBG Edition 🪖

> **Trending Viral Tap-to-Fly Meme Game** inspired by **Flying Balayya** and **PUBG Erangel Battlegrounds**!  
> Dodge sniper towers, dodge PUBG frying pans, grab Level 3 helmets, drink energy drinks, trigger Flare Gun Rage mode, and claim your **Winner Winner Chicken Dinner**!

---

## 🎮 Play & Controls

| Action | Desktop Keyboard | Mobile / Touch |
| :--- | :--- | :--- |
| **Flap / Jump** | `Spacebar` / `Arrow Up` / `W` | **Tap Screen** |
| **Pause / Resume** | `P` | **Pause Button (Top Right)** |
| **Open Customizer Studio** | `C` | **Palette Button (Top Right)** |

---

## ⚡ Power-ups & Battlefield Hazards

- 🪖 **Level 3 Helmet (Shield)**: Protects Punju from 1 obstacle collision. When hit, the helmet shatters with a metallic crack, gives 1.2s invulnerability, and saves your life!
- ⚡ **Energy Drink**: 8 seconds of 2X score multiplier and magnetic corn/item attraction!
- 🔫 **Flare Gun / Punju Rage Mode**: 5.5 seconds of fiery invulnerability where Punju blasts through obstacles, smashing them into pieces!
- 🍳 **PUBG Frying Pan Hazards**: Cast-iron pans hovering in the gap with physics bobbing.
- 💥 **Mass Near-Miss Combos**: Glide dangerously close to the obstacle edge to trigger Balayya-style `"MASS NEAR MISS!"` popups and score multipliers up to **5x**!

---

## 🚀 How to Deploy to Vercel in 3 Steps

### Step 1: Push this project to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Flying Punju PUBG Edition"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/flying-punju.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **"Add New Project"** -> Select your **`flying-punju`** repository.
3. Framework Preset: **Vite** (auto-detected).
4. Click **"Deploy"**!

Your game is now live on the internet with an official URL (e.g. `https://flying-punju.vercel.app`)!

---

## 🎨 How to Replace Character & Sounds

You can customize your character and audio in two ways:

### Method A: Live In-Game Customizer Studio (Instant Preview)
1. Click the **Palette Icon** (top right) in the game.
2. In the **Character Sprite** tab: click **"Upload Image"** to test your PNG/SVG directly from your device!
3. In the **Custom Sounds** tab: click **"Test MP3"** to upload and preview your own sound clips!

---

### Method B: Permanent GitHub Replacement (For Live Vercel Deployments)

#### 1. Replace the Character:
Place your character image at:
```
public/assets/character.png
```
- **Recommended format:** Transparent PNG (square or roughly 120x100 aspect ratio).
- **Facing direction:** Facing right.

#### 2. Replace the Sounds:
Drop your custom MP3 files into:
```
public/assets/sounds/
├── flap.mp3       (Wing flap / dialogue sound)
├── point.mp3      (Score / passing obstacle chime)
├── hit.mp3        (Obstacle collision / pan clang)
├── powerup.mp3    (Helmet / energy drink pickup)
├── rage.mp3       (Flare gun / rage mode overdrive)
└── bgm.mp3        (Looping battle background music)
```

> **Note:** If any audio file is missing, the game automatically uses its built-in **Web Audio API synthesizer**, so the game **never breaks or crashes**!

#### 3. Update Vercel:
After adding your files, push to GitHub:
```bash
git add .
git commit -m "Add custom character and voice lines"
git push origin main
```
Vercel will automatically re-deploy your custom version in under 30 seconds!

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start local dev server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🏆 Tech Stack
- **Framework:** React 19 + TypeScript
- **Bundler:** Vite 6
- **Graphics Engine:** HTML5 Canvas 2D with Delta-Time 60-120 FPS Sub-pixel Physics
- **Audio Engine:** Dual-mode (Web Audio API Synthesizer + Custom HTML5 Audio Loader)
- **Deployment:** Vercel-ready with zero server dependencies
