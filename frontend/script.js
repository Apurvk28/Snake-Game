const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const finalScoreEl = document.getElementById("final-score");
const leaderboardListEl = document.getElementById("leaderboard-list");

const bodyEl = document.body;

// Load Sprites
const imgHead = new Image(); imgHead.src = "assets/head.svg";
const imgBody = new Image(); imgBody.src = "assets/body.svg";
const imgApple = new Image(); imgApple.src = "assets/apple.svg";

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
let baseSpeed = 100;

// Mechanics State
let isHyperMode = false;
let hyperModeTimer = 0;
let isGlitchMode = false;
let glitchModeTimer = 0;
let specialDrop = null;   // { x, y, type: 'hyper' | 'glitch', active: false }
let specialDropTimer = 0;

let spawnSpecialCounter = 0;

let floatingTexts = [];

let highScore = localStorage.getItem("snakeNeonHighScore") || 0;
let leaderboardData = JSON.parse(localStorage.getItem("snakeNeonLeaderboard")) || [];
let gameLoopId;
let isGameOver = false;
let isPaused = false;
let speed = 100; // ms per frame
let lastTime = 0;

highScoreEl.innerText = highScore;
updateLeaderboardUI();

function updateLeaderboardUI() {
    leaderboardListEl.innerHTML = "";
    if (leaderboardData.length === 0) {
        leaderboardListEl.innerHTML = "<li style='border-left:none;text-align:center;color:#888;'>No scores yet</li>";
        return;
    }
    leaderboardData.forEach((entry, idx) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>#${idx + 1} ${entry.date}</span> <span class="score-val">${entry.score}</span>`;
        if (idx === 0) li.style.borderLeftColor = "#ffcc00";
        else if (idx === 1) li.style.borderLeftColor = "#cccccc";
        else if (idx === 2) li.style.borderLeftColor = "#cd7f32";
        leaderboardListEl.appendChild(li);
    });
}

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
    speed = baseSpeed;
    isGameOver = false;
    particles = [];
    floatingTexts = [];

    // Mechanics Reset
    isHyperMode = false;
    isGlitchMode = false;
    specialDrop = null;
    spawnSpecialCounter = 0;
    bodyEl.classList.remove("glitch-mode");

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

class FloatingText {
    constructor(x, y, text, color, sizeStr = "20px") {
        this.x = x * GRID_SIZE + GRID_SIZE / 2;
        this.y = y * GRID_SIZE;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.sizeStr = sizeStr;
    }
    update() {
        this.y -= 1; // Float up
        this.life -= 0.02; // Fade out
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.textAlign = "center";
        ctx.font = `bold ${this.sizeStr} Orbitron, sans-serif`;
        ctx.fillText(this.text, this.x, this.y);
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

        ctx.save();
        // Translate to segment center for rotation
        ctx.translate(segment.x * GRID_SIZE + GRID_SIZE / 2, segment.y * GRID_SIZE + GRID_SIZE / 2);

        if (isHead) {
            // Calculate rotation based on direction
            let angle = 0;
            if (dx === 1) angle = Math.PI / 2;
            else if (dx === -1) angle = -Math.PI / 2;
            else if (dy === 1) angle = Math.PI;
            ctx.rotate(angle);
            ctx.drawImage(imgHead, -GRID_SIZE / 2 - 2, -GRID_SIZE / 2 - 2, GRID_SIZE + 4, GRID_SIZE + 4);
        } else {
            ctx.globalAlpha = 1 - (index / snake.length) * 0.6;
            ctx.drawImage(imgBody, -GRID_SIZE / 2 + 1, -GRID_SIZE / 2 + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        }
        ctx.restore();
    });
}

function drawFood() {
    // Pulsing size effect
    const pulse = Math.sin(Date.now() / 150) * 0.5 + 0.5;
    const sizeOffset = pulse * 4;

    ctx.shadowBlur = 15;
    ctx.shadowColor = NEON_RED;
    ctx.drawImage(
        imgApple,
        food.x * GRID_SIZE - sizeOffset / 2,
        food.y * GRID_SIZE - sizeOffset / 2,
        GRID_SIZE + sizeOffset,
        GRID_SIZE + sizeOffset
    );
    // Special Drops
    if (specialDrop && specialDrop.active) {
        const pulse = Math.sin(Date.now() / 150) * 0.5 + 0.5;
        const sizeOffset = pulse * 4;

        ctx.shadowBlur = 15;
        let color = specialDrop.type === 'hyper' ? NEON_BLUE : NEON_PURPLE;
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        // Draw diamond
        ctx.beginPath();
        let ox = specialDrop.x * GRID_SIZE + GRID_SIZE / 2;
        let oy = specialDrop.y * GRID_SIZE + GRID_SIZE / 2;
        let sr = (GRID_SIZE / 2) + sizeOffset / 2;
        ctx.moveTo(ox, oy - sr);
        ctx.lineTo(ox + sr, oy);
        ctx.lineTo(ox, oy + sr);
        ctx.lineTo(ox - sr, oy);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        floatingTexts[i].draw(ctx);
        if (floatingTexts[i].life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function triggerShake() {
    bodyEl.classList.remove("shake");
    void bodyEl.offsetWidth; // trigger reflow
    bodyEl.classList.add("shake");
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
        spawnFood();
        // Speed up noticeably after each food
        if (baseSpeed > 40) baseSpeed -= 6;

        let multInc = isHyperMode ? 5 : 1;
        let pts = 10 * multInc;
        score += pts;

        floatingTexts.push(new FloatingText(food.x, food.y, "+" + pts, NEON_GREEN, "18px"));

        spawnSpecialCounter++;
        if (spawnSpecialCounter > 6 && Math.random() < 0.3 && (!specialDrop || !specialDrop.active)) {
            spawnSpecialCounter = 0;
            spawnSpecialDrop();
        }

        scoreEl.innerText = score;
    } else {
        snake.pop();
    }

    // Special Drop Collision
    if (specialDrop && specialDrop.active && head.x === specialDrop.x && head.y === specialDrop.y) {
        specialDrop.active = false;
        triggerShake();
        if (specialDrop.type === 'hyper') {
            isHyperMode = true;
            hyperModeTimer = 40; // Approx 4 seconds
            baseSpeed = 50;
            floatingTexts.push(new FloatingText(head.x, head.y, "HYPERCORE!", NEON_BLUE, "28px"));
            createExplosion(head.x, head.y, NEON_BLUE);
        } else if (specialDrop.type === 'glitch') {
            isGlitchMode = true;
            glitchModeTimer = 50; // 5 seconds
            score += 50;
            scoreEl.innerText = score;
            floatingTexts.push(new FloatingText(head.x, head.y, "+50 GLITCH!", NEON_PURPLE, "28px"));
            createExplosion(head.x, head.y, NEON_PURPLE);
            bodyEl.classList.add("glitch-mode");
        }
    }
}

function spawnSpecialDrop() {
    specialDrop = {
        x: Math.floor(Math.random() * TILE_COUNT_X),
        y: Math.floor(Math.random() * TILE_COUNT_Y),
        type: Math.random() < 0.2 ? 'hyper' : 'glitch',
        active: true
    };
    specialDropTimer = 100; // Lives for ~10 seconds
}

function gameOver() {
    isGameOver = true;
    bodyEl.classList.remove("glitch-mode");
    createExplosion(snake[0].x, snake[0].y, NEON_BLUE);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeNeonHighScore", highScore);
        highScoreEl.innerText = highScore;
    }

    // Update Leaderboard
    if (score > 0) {
        const today = new Date();
        const dateStr = (today.getMonth() + 1) + "/" + today.getDate() + " " + today.getHours() + ":" + today.getMinutes().toString().padStart(2, '0');
        leaderboardData.push({ score: score, date: dateStr });
        leaderboardData.sort((a, b) => b.score - a.score);
        leaderboardData = leaderboardData.slice(0, 10); // Keep top 10
        localStorage.setItem("snakeNeonLeaderboard", JSON.stringify(leaderboardData));
        updateLeaderboardUI();
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

        if (specialDrop && specialDrop.active) {
            specialDropTimer--;
            if (specialDropTimer <= 0) specialDrop.active = false;
        }

        if (isHyperMode) {
            hyperModeTimer--;
            triggerShake();
            speed = 40; // Super fast
            if (hyperModeTimer <= 0) {
                isHyperMode = false;
                speed = baseSpeed;
            }
        } else {
            speed = baseSpeed;
        }

        if (isGlitchMode) {
            glitchModeTimer--;
            if (glitchModeTimer <= 0) {
                isGlitchMode = false;
                bodyEl.classList.remove("glitch-mode");
            }
        }

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

    let actualKey = e.key;

    // Apply Glitch Reversal
    if (isGlitchMode && !isGameOver && startScreen.classList.contains("hidden")) {
        switch (actualKey) {
            case "ArrowLeft": actualKey = "ArrowRight"; break;
            case "a": actualKey = "d"; break;
            case "ArrowRight": actualKey = "ArrowLeft"; break;
            case "d": actualKey = "a"; break;
            case "ArrowUp": actualKey = "ArrowDown"; break;
            case "w": actualKey = "s"; break;
            case "ArrowDown": actualKey = "ArrowUp"; break;
            case "s": actualKey = "w"; break;
        }
    }

    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    switch (actualKey) {
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
