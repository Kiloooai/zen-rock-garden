// Zen Rock Garden - Interactive meditation toy
const canvas = document.getElementById('garden');
const ctx = canvas.getContext('2d');
const rocksContainer = document.getElementById('rocks-container');
const rakeBtn = document.getElementById('rake-mode');
const rockBtn = document.getElementById('rock-mode');
const clearBtn = document.getElementById('clear-btn');
const quoteBtn = document.getElementById('quote-btn');
const quoteDisplay = document.getElementById('quote-display');
const quoteText = document.getElementById('quote-text');
const quoteClose = document.getElementById('quote-close');

// Set canvas size
canvas.width = 800;
canvas.height = 500;

// State
let mode = 'rake'; // 'rake' or 'rock'
let isRaking = false;
let lastRakePos = null;
let rocks = [];
let rockIdCounter = 0;

// Gravel simulation - each pixel's "height" (0-255)
const gravel = [];
const GRAVEL_RES = 2; // process every 2nd pixel for performance
const SMOOTH_AMOUNT = 0.15;
const DAMPING = 0.98;

// Initialize flat gravel
for (let y = 0; y < canvas.height; y++) {
  gravel[y] = [];
  for (let x = 0; x < canvas.width; x++) {
    gravel[y][x] = 128 + (Math.random() * 20 - 10);
  }
}

// Zen quotes
const quotes = [
  "The stone that rolls into the river becomes smooth, not by force, but by time.",
  "In the garden of your mind, what weeds would you pull today?",
  "The raked gravel is not a path to follow, but a pattern to behold.",
  "A single rock in the void defines the space around it.",
  "Still water reflects the sky; a still mind reflects itself.",
  "The sound of one hand raking is heard in the silence between thoughts.",
  "Do not seek peace. Seek the gardener who rakes the turmoil.",
  "Between the stones, the void gives them meaning.",
  "Each stroke of the rake is a breath. Inhale. Exhale. Repeat.",
  "The mountain does not hurry, yet it is never late."
];

// Draw gravel based on height map
function drawGravel() {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const h = gravel[y][x];
      const idx = (y * canvas.width + x) * 4;

      // Sandy brown tones with lighting from height
      const baseR = 194, baseG = 178, baseB = 128;
      const shade = (h - 128) / 128;

      data[idx] = Math.min(255, Math.max(0, baseR + shade * 30));
      data[idx + 1] = Math.min(255, Math.max(0, baseG + shade * 25));
      data[idx + 2] = Math.min(255, Math.max(0, baseB + shade * 20));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// Rake function - smooths gravel along a path
function rake(x1, y1, x2, y2, radius = 15) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < 1) return;

  const steps = Math.ceil(dist / 2);
  const ux = dx / dist;
  const uy = dy / dist;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = x1 + ux * (i * 2);
    const cy = y1 + uy * (i * 2);

    for (let dy_off = -radius; dy_off <= radius; dy_off++) {
      for (let dx_off = -radius; dx_off <= radius; dx_off++) {
        const px = Math.floor(cx + dx_off);
        const py = Math.floor(cy + dy_off);

        if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
          const distFromCenter = Math.sqrt(dx_off*dx_off + dy_off*dy_off);
          if (distFromCenter <= radius) {
            // Smooth toward the average of neighbors along rake direction
            const influence = 1 - (distFromCenter / radius);
            const target = 128; // flatten toward neutral

            // Simple version: push toward flat
            gravel[py][px] = gravel[py][px] * (1 - influence * 0.3) + target * (influence * 0.3);
          }
        }
      }
    }
  }
}

// Physics update for gravel waves
function updateGravel() {
  const newGravel = Array.from({length: canvas.height}, () => new Array(canvas.width).fill(0));

  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < canvas.width - 1; x++) {
      // Average of neighbors
      const avg = (
        gravel[y-1][x] + gravel[y+1][x] +
        gravel[y][x-1] + gravel[y][x+1]
      ) / 4;

      let val = gravel[y][x];
      val = val + (avg - val) * SMOOTH_AMOUNT;
      val *= DAMPING;
      val = Math.max(0, Math.min(255, val));
      newGravel[y][x] = val;
    }
  }

  // Copy back with boundary preservation
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (newGravel[y][x] !== undefined) {
        gravel[y][x] = newGravel[y][x];
      }
    }
  }
}

// Animation loop
function animate() {
  updateGravel();
  drawGravel();
  requestAnimationFrame(animate);
}

// Rock creation
function createRock(x, y) {
  const rock = document.createElement('div');
  rock.className = 'rock';
  rock.style.left = (x - 30) + 'px';
  rock.style.top = (y - 25) + 'px';
  rock.dataset.id = rockIdCounter++;

  // Randomize rock shape slightly
  const skew = Math.random() * 20 - 10;
  const rotate = Math.random() * 10 - 5;
  rock.style.transform = `skewX(${skew}deg) rotate(${rotate}deg)`;

  rocksContainer.appendChild(rock);
  rocks.push({
    el: rock,
    x: x,
    y: y,
    width: 60,
    height: 50
  });

  // Occasional pulse
  if (Math.random() < 0.3) {
    rock.classList.add('pulsing');
  }

  // Click to drag rock
  rock.addEventListener('mousedown', startDragRock);
  rock.addEventListener('touchstart', startDragRock, {passive: false});
}

// Drag rock logic
let dragRock = null;
let dragOffset = {x: 0, y: 0};

function startDragRock(e) {
  if (mode !== 'rock') return;
  e.preventDefault();
  const rockEl = e.currentTarget;
  const rect = rockEl.getBoundingClientRect();
  const containerRect = document.getElementById('garden-container').getBoundingClientRect();

  dragRock = rocks.find(r => r.el === rockEl);
  if (dragRock) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragOffset.x = clientX - rect.left;
    dragOffset.y = clientY - rect.top;
    rockEl.classList.add('dragging');
  }
}

// Mouse/touch handlers
canvas.addEventListener('mousedown', startRake);
canvas.addEventListener('mousemove', moveRake);
canvas.addEventListener('mouseup', endRake);
canvas.addEventListener('mouseleave', endRake);

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  startRake(e.touches[0]);
}, {passive: false});
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  moveRake(e.touches[0]);
}, {passive: false});
canvas.addEventListener('touchend', endRake);

function startRake(e) {
  if (mode !== 'rake') return;
  const pos = getCanvasPos(e);
  isRaking = true;
  lastRakePos = pos;
}

function moveRake(e) {
  if (!isRaking || mode !== 'rake') return;
  const pos = getCanvasPos(e);
  if (lastRakePos) {
    rake(lastRakePos.x, lastRakePos.y, pos.x, pos.y, 12);
  }
  lastRakePos = pos;
}

function endRake() {
  isRaking = false;
  lastRakePos = null;
}

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// Mode switching
rakeBtn.addEventListener('click', () => setMode('rake'));
rockBtn.addEventListener('click', () => setMode('rock'));

function setMode(newMode) {
  mode = newMode;
  rakeBtn.classList.toggle('active', mode === 'rake');
  rockBtn.classList.toggle('active', mode === 'rock');
  canvas.style.cursor = mode === 'rake' ? 'crosshair' : 'pointer';
}

// Rock placement on click (in rock mode)
canvas.addEventListener('click', (e) => {
  if (mode === 'rock' && !dragRock) {
    const pos = getCanvasPos(e);
    createRock(pos.x, pos.y);
    // Add small ripple effect
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        rake(pos.x, pos.y, pos.x + (Math.random()*20-10), pos.y + (Math.random()*20-10), 8);
      }, i * 100);
    }
  }
});

// Clear garden
clearBtn.addEventListener('click', () => {
  rocks.forEach(r => r.el.remove());
  rocks = [];

  // Reset gravel to flat with slight noise
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      gravel[y][x] = 128 + (Math.random() * 10 - 5);
    }
  }
});

// Quote display
quoteBtn.addEventListener('click', showRandomQuote);
quoteClose.addEventListener('click', () => {
  quoteDisplay.classList.add('hidden');
});

function showRandomQuote() {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  quoteText.textContent = `"${quote}"`;
  quoteDisplay.classList.remove('hidden');
}

// Global mouse up for rock dragging
document.addEventListener('mouseup', () => {
  if (dragRock) {
    dragRock.el.classList.remove('dragging');
    dragRock = null;
  }
});
document.addEventListener('touchend', () => {
  if (dragRock) {
    dragRock.el.classList.remove('dragging');
    dragRock = null;
  }
});

// Drag rock update
document.addEventListener('mousemove', (e) => {
  if (dragRock) {
    const containerRect = document.getElementById('garden-container').getBoundingClientRect();
    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;

    // Constrain to garden
    newX = Math.max(0, Math.min(canvas.width - 60, newX));
    newY = Math.max(0, Math.min(canvas.height - 50, newY));

    dragRock.x = newX + 30;
    dragRock.y = newY + 25;
    dragRock.el.style.left = newX + 'px';
    dragRock.el.style.top = newY + 'px';

    // Rake a little trail behind rock
    rake(dragRock.x, dragRock.y, dragRock.x + (Math.random()*10-5), dragRock.y + (Math.random()*10-5), 6);
  }
});

document.addEventListener('touchmove', (e) => {
  if (dragRock && e.touches.length === 1) {
    const touch = e.touches[0];
    const containerRect = document.getElementById('garden-container').getBoundingClientRect();
    let newX = touch.clientX - containerRect.left - dragOffset.x;
    let newY = touch.clientY - containerRect.top - dragOffset.y;

    newX = Math.max(0, Math.min(canvas.width - 60, newX));
    newY = Math.max(0, Math.min(canvas.height - 50, newY));

    dragRock.x = newX + 30;
    dragRock.y = newY + 25;
    dragRock.el.style.left = newX + 'px';
    dragRock.el.style.top = newY + 'px';

    rake(dragRock.x, dragRock.y, dragRock.x + (Math.random()*10-5), dragRock.y + (Math.random()*10-5), 6);
  }
}, {passive: false});

// Start animation
animate();

// Add initial rocks for first-time visitors
setTimeout(() => {
  if (rocks.length === 0) {
    createRock(200, 200);
    createRock(550, 300);
    createRock(350, 350);
    // Rake a spiral from center
    for (let i = 0; i < 50; i++) {
      const angle = i * 0.3;
      const radius = i * 4;
      const x = 400 + Math.cos(angle) * radius;
      const y = 250 + Math.sin(angle) * radius;
      if (i > 0) {
        rake(400 + Math.cos((i-1)*0.3) * ((i-1)*4), 250 + Math.sin((i-1)*0.3) * ((i-1)*4), x, y, 8);
      }
    }
  }
}, 500);

console.log("⛰️ Zen Rock Garden loaded. Rake the gravel. Find peace.");
