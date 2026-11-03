# Custom Sounds Directory 🎵

Drop your custom `.mp3` sound files directly into this directory!

The game automatically detects and plays these audio files when present:

### 1. Game Over Sounds (Score-Based Performance Tiers):
The game plays audio based on how far you survived (no random jumble):
- `gameover1.mp3` - **Low Score (< 3 passes)** (Early casualty failure scolding)
- `gameover2.mp3` - **Ok-Ok Run (3 - 9 passes)** (Average survival performance)
- `gameover3.mp3` - **Good Run (10 - 19 passes)** (Pochinki fighter cock)
- `gameover4.mp3` - **High Score (20+ passes / New Record)** (Winner Winner Chicken Dinner!)

*(If a higher tier file isn't uploaded yet, it smoothly falls back to gameover1.mp3 so your sound always plays!)*

### 2. Gameplay Action Sounds:
- `bgm.mp3` - Looping background battle music
- `start.mp3` - Match start horn / rooster opening crow
- `hit.mp3` - Hitting an obstacle / frying pan clang
- `flap.mp3` - Flap / wing jump whoosh
- `point.mp3` - Score pass / golden coin chime
- `powerup.mp3` - Level 3 Helmet / Energy Drink pickup
- `rage.mp3` - Flare Gun / Balayya Mass Rage mode

> **Note:** If any sound file is missing, the game smoothly falls back to its built-in Web Audio procedural synthesizer, so the game will NEVER crash or be silent!
