const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const messageEl = document.getElementById('message');
const restartBtn = document.getElementById('restartBtn');

let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let bestScore = localStorage.getItem('flappyBest') || 0;
bestEl.textContent = bestScore;

const bird = {
  x: 80,
  y: canvas.height / 2,
  radius: 20,
  vy: 0,
  gravity: 0.6,
  jump: -12
};

const pipes = [];
let pipeWidth = 60;
let pipeGap = 180;
let pipeSpeed = 3;
let frame = 0;

function init() {
  gameState = 'playing';
  score = 0;
  bird.y = canvas.height / 2;
  bird.vy = 0;
  pipes.length = 0;
  updateScore();
  messageEl.textContent = '';
  restartBtn.style.display = 'none';
  loop();
}

function update() {
  if (gameState !== 'playing') return;

  // Bird physics
  bird.vy += bird.gravity;
  bird.y += bird.vy;

  // Ground/ceiling collision
  if (bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0) {
    gameOver();
    return;
  }

  // Pipes
  frame++;
  if (frame % 90 === 0) { // Spawn every 90 frames
    const topHeight = 50 + Math.random() * (canvas.height - pipeGap - 100);
    pipes.push({
      x: canvas.width,
      top: topHeight,
      bottom: canvas.height - (topHeight + pipeGap),
      scored: false
    });
  }

  // Move pipes
  for (let i = pipes.length - 1; i >= 0; i--) {
    pipes[i].x -= pipeSpeed;

    // Score
    if (!pipes[i].scored && pipes[i].x + pipeWidth < bird.x) {
      score++;
      pipes[i].scored = true;
      updateScore();
    }

    // Collision
    if (bird.x + bird.radius > pipes[i].x &&
        bird.x - bird.radius < pipes[i].x + pipeWidth) {
      if (bird.y - bird.radius < pipes[i].top || bird.y + bird.radius > canvas.height - pipes[i].bottom) {
        gameOver();
        return;
      }
    }

    // Remove offscreen
    if (pipes[i].x + pipeWidth < 0) {
      pipes.splice(i, 1);
    }
  }
}

function draw() {
  // Clear
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Pipes
  ctx.fillStyle = '#00ff88';
  ctx.strokeStyle = '#00cc6a';
  ctx.lineWidth = 4;
  for (let pipe of pipes) {
    // Top pipe
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
    ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.top);
    // Bottom pipe
    ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipeWidth, pipe.bottom);
    ctx.strokeRect(pipe.x, canvas.height - pipe.bottom, pipeWidth, pipe.bottom);
    // Gap highlight
    ctx.fillStyle = 'rgba(0,255,136,0.1)';
    ctx.fillRect(pipe.x - 10, pipe.top, pipeWidth + 20, pipeGap);
  }

  // Bird
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(Math.atan2(bird.vy, 5) * 0.3);
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath();
  ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffc107';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Eye
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(10, -5, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(12, -4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Ground gradient (subtle)
  const grad = ctx.createLinearGradient(0, canvas.height - 50, 0, canvas.height);
  grad.addColorStop(0, 'rgba(0,255,136,0.1)');
  grad.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
}

function gameOver() {
  gameState = 'gameover';
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('flappyBest', bestScore);
    bestEl.textContent = bestScore;
  }
  messageEl.textContent = `Game Over! Score: ${score}`;
  restartBtn.style.display = 'inline-block';
}

function updateScore() {
  scoreEl.textContent = score;
}

function loop() {
  update();
  draw();
  if (gameState === 'playing') {
    requestAnimationFrame(loop);
  }
}

// Controls
function jump() {
  if (gameState === 'playing') {
    bird.vy = bird.jump;
  } else if (gameState === 'start') {
    init();
  }
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    jump();
  }
});

canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  jump();
}, { passive: false });

// Start screen
draw(); // Initial draw
messageEl.textContent = 'Click/Tap or Space to Jump!';