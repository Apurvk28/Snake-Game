const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const finalScoreEl = document.getElementById("final-score");

// Game Constants
const GRID_SIZE = 20;
const TILE_COUNT_X = canvas.width / GRID_SIZE;
const TILE_COUNT_Y = canvas.height / GRID_SIZE;

// Colors
const NEON_GREEN = "#00ffaa";
const NEON_BLUE = "#00eeff";
const NEON_RED = "#ff0055";

// Game State
let snake = [];
let food = {};
let particles = [];
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem("snakeNeonHighScore") || 0;
let gameLoopId;
let isGameOver = false;
let isPaused = false;
let speed = 100; // ms per frame
let lastTime = 0;

highScoreEl.innerText = highScore;

// Initialization
function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    dx = 1;
    dy = 0;
    score = 0;
    speed = 100;
    isGameOver = false;
    particles = [];
    scoreEl.innerText = score;
    spawnFood();
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * TILE_COUNT_X),
        y: Math.floor(Math.random() * TILE_COUNT_Y)
    };
    // Ensure food doesn't spawn on snake
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            spawnFood();
            break;
        }
    }
}

// Particle System
class Particle {
    constructor(x, y, color) {
        this.x = x * GRID_SIZE + GRID_SIZE / 2;
        this.y = y * GRID_SIZE + GRID_SIZE / 2;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.05;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Drawing Functions
function drawGrid() {
    ctx.strokeStyle = "rgba(0, 255, 170, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        ctx.fillStyle = isHead ? NEON_BLUE : NEON_GREEN;
        ctx.shadowBlur = 15;
        ctx.shadowColor = isHead ? NEON_BLUE : NEON_GREEN;

        // Make tail fade out slightly
        if (!isHead) {
            ctx.globalAlpha = 1 - (index / snake.length) * 0.6;
        }

        // Draw text instead of rectangle
        let kaustubhSize = 12 + (snake.length - 3) * 1.5;
        ctx.font = `bold ${kaustubhSize}px Orbitron, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Kaustubh", segment.x * GRID_SIZE + GRID_SIZE / 2, segment.y * GRID_SIZE + GRID_SIZE / 2);

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    });
}

function drawFood() {
    // Pulsing effect
    const pulse = Math.sin(Date.now() / 150) * 0.5 + 0.5;
    ctx.fillStyle = NEON_RED;
    ctx.shadowBlur = 10 + pulse * 15;
    ctx.shadowColor = NEON_RED;

    let kirtiSize = 14 + pulse * 4;
    ctx.font = `bold ${kirtiSize}px Orbitron, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Kirti", food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2);

    ctx.shadowBlur = 0;
}

function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Game Logic
function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall Collision
    if (head.x < 0 || head.x >= TILE_COUNT_X || head.y < 0 || head.y >= TILE_COUNT_Y) {
        gameOver();
        return;
    }

    // Self Collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Food Collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.innerText = score;
        createExplosion(food.x, food.y, NEON_RED);
        spawnFood();
        // Speed up very slightly
        if (speed > 50) speed -= 2;
    } else {
        snake.pop();
    }
}

function gameOver() {
    isGameOver = true;
    createExplosion(snake[0].x, snake[0].y, NEON_BLUE);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeNeonHighScore", highScore);
        highScoreEl.innerText = highScore;
    }

    finalScoreEl.innerText = score;
    setTimeout(() => {
        gameOverScreen.classList.remove("hidden");
    }, 500);
}

// Main Game Loop
function gameTick(timestamp) {
    if (isGameOver) {
        // Just draw particles fading out
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawParticles();
        drawSnake();
        requestAnimationFrame(gameTick);
        return;
    }

    if (timestamp - lastTime >= speed) {
        lastTime = timestamp;

        // Clear canvas with slight trailing effect
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawGrid();
        moveSnake();
        if (!isGameOver) {
            drawFood();
            drawSnake();
        }
    } else {
        // Still clear and draw for smooth particles/pulsing even if snake didn't move
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        drawFood();
        drawSnake();
    }

    drawParticles();

    gameLoopId = requestAnimationFrame(gameTick);
}

function startGame() {
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    initGame();
    lastTime = performance.now();
    cancelAnimationFrame(gameLoopId);
    gameLoopId = requestAnimationFrame(gameTick);
}

// Event Listeners
window.addEventListener("keydown", (e) => {
    // Prevent default scrolling for arrows
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].indexOf(e.key) > -1) {
        e.preventDefault();
    }

    if (isGameOver && e.key === "Enter") {
        startGame();
        return;
    }
    if (!isGameOver && startScreen.classList.contains("hidden") === false && (e.key === "Enter" || e.key === " ")) {
        startGame();
        return;
    }

    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    switch (e.key) {
        case "ArrowLeft":
        case "a":
            if (!goingRight) { dx = -1; dy = 0; }
            break;
        case "ArrowUp":
        case "w":
            if (!goingDown) { dx = 0; dy = -1; }
            break;
        case "ArrowRight":
        case "d":
            if (!goingLeft) { dx = 1; dy = 0; }
            break;
        case "ArrowDown":
        case "s":
            if (!goingUp) { dx = 0; dy = 1; }
            break;
    }
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

// Draw initial static screen
ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);
drawGrid();
