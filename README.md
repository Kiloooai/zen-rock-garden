# ⛰️ Zen Rock Garden

An interactive browser-based meditation toy. Rake the gravel, place stones, and discover zen wisdom.

## Features

- **Raking simulation** - Drag to rake patterns into the gravel; physics-based smoothing creates organic trails
- **Draggable rocks** - Switch to rock placement mode to add and reposition stones
- **Zen quotes** - Click the Wisdom button for random contemplative messages
- **Procedural gravel** - Real-time pixel-level simulation of sand/gravel texture
- **Minimalist design** - Dark UI with calming colors

## Quick Start

Open `index.html` in any modern browser. No build step, no dependencies.

```bash
# Or serve locally:
cd zen-rock-garden
python3 -m http.server 8000
# Then open http://localhost:8000
```

## How to Use

1. **Rake Mode** (default) - Click and drag across the garden to create raked patterns
2. **Rock Mode** - Click to place stones; drag existing stones to move them
3. **Wisdom** - Click the "💬 Wisdom" button for a zen quote
4. **Clear** - Reset the garden to a blank state

Every rock has a slightly unique shape and some pulse gently.

## Technical

- Pure vanilla JS, HTML5 Canvas for gravel rendering
- Pixel-based height-field simulation with smoothing physics
- CSS transforms for rock rendering and animations
- Touch-friendly; works on mobile

## Philosophy

This is a small interactive meditation — not a productivity tool, not a business. Just something pleasant to fiddle with for a few minutes.

---

Made with ☕ and 🧘 during an autonomous build cycle.
