// Tetris Game Module
export function init(container) {
    'use strict';

    // Game constants
    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 30;
    const COLORS = [
        '#FF0D72', // I - Cyan
        '#0DC2FF', // O - Blue
        '#0DFF72', // T - Green
        '#F538FF', // S - Purple
        '#FF8E0D', // Z - Orange
        '#FFE138', // J - Yellow
        '#3877FF'  // L - Dark Blue
    ];

    // Tetromino pieces
    const PIECES = [
        // I
        [[1, 1, 1, 1]],
        // O
        [[1, 1],
         [1, 1]],
        // T
        [[0, 1, 0],
         [1, 1, 1]],
        // S
        [[0, 1, 1],
         [1, 1, 0]],
        // Z
        [[1, 1, 0],
         [0, 1, 1]],
        // J
        [[1, 0, 0],
         [1, 1, 1]],
        // L
        [[0, 0, 1],
         [1, 1, 1]]
    ];

    class TetrisGame {
        constructor() {
            this.canvas = container.querySelector('#gameCanvas');
            this.ctx = this.canvas.getContext('2d');
            this.nextCanvas = container.querySelector('#nextCanvas');
            this.nextCtx = this.nextCanvas.getContext('2d');
            
            this.scoreEl = container.querySelector('#score');
            this.linesEl = container.querySelector('#lines');
            this.levelEl = container.querySelector('#level');
            this.startBtn = container.querySelector('#startBtn');
            this.pauseBtn = container.querySelector('#pauseBtn');
            this.resetBtn = container.querySelector('#resetBtn');
            this.gameOverOverlay = container.querySelector('#gameOverOverlay');
            this.finalScoreEl = container.querySelector('#finalScore');
            this.playAgainBtn = container.querySelector('#playAgainBtn');
            
            this.board = [];
            this.currentPiece = null;
            this.nextPiece = null;
            this.currentX = 0;
            this.currentY = 0;
            this.currentColor = 0;
            this.score = 0;
            this.lines = 0;
            this.level = 1;
            this.gameRunning = false;
            this.gamePaused = false;
            this.dropCounter = 0;
            this.lastTime = 0;
            this.dropInterval = 1000;
            
            this.init();
        }

        init() {
            // Initialize board
            this.board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
            
            // Event listeners
            this.startBtn.addEventListener('click', () => this.start());
            this.pauseBtn.addEventListener('click', () => this.togglePause());
            this.resetBtn.addEventListener('click', () => this.reset());
            this.playAgainBtn.addEventListener('click', () => {
                this.gameOverOverlay.style.display = 'none';
                this.reset();
                this.start();
            });
            
            // Keyboard controls
            document.addEventListener('keydown', (e) => this.handleKeyPress(e));
            
            // Initial draw
            this.draw();
            this.drawNext();
        }

        handleKeyPress(e) {
            if (!this.gameRunning || this.gamePaused) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    this.score += 1;
                    this.updateScore();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case ' ':
                    e.preventDefault();
                    this.hardDrop();
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        }

        start() {
            if (this.gameRunning) return;
            
            this.gameRunning = true;
            this.gamePaused = false;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            
            // Generate first pieces
            this.nextPiece = this.generatePiece();
            this.spawnPiece();
            
            // Start game loop
            this.lastTime = performance.now();
            this.gameLoop();
        }

        togglePause() {
            if (!this.gameRunning) return;
            
            this.gamePaused = !this.gamePaused;
            this.pauseBtn.textContent = this.gamePaused ? 'Reprendre' : 'Pause';
            
            if (!this.gamePaused) {
                this.lastTime = performance.now();
                this.gameLoop();
            }
        }

        reset() {
            this.gameRunning = false;
            this.gamePaused = false;
            this.board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
            this.currentPiece = null;
            this.nextPiece = null;
            this.score = 0;
            this.lines = 0;
            this.level = 1;
            this.dropInterval = 1000;
            
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            this.pauseBtn.textContent = 'Pause';
            this.gameOverOverlay.style.display = 'none';
            
            this.updateScore();
            this.draw();
            this.drawNext();
        }

        gameLoop(currentTime = 0) {
            if (!this.gameRunning || this.gamePaused) return;
            
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.dropCounter += deltaTime;
            
            if (this.dropCounter > this.dropInterval) {
                this.movePiece(0, 1);
                this.dropCounter = 0;
            }
            
            this.draw();
            requestAnimationFrame((time) => this.gameLoop(time));
        }

        generatePiece() {
            const typeId = Math.floor(Math.random() * PIECES.length);
            return {
                shape: PIECES[typeId],
                color: COLORS[typeId],
                typeId: typeId
            };
        }

        spawnPiece() {
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.generatePiece();
            this.currentX = Math.floor((COLS - this.currentPiece.shape[0].length) / 2);
            this.currentY = 0;
            this.currentColor = this.currentPiece.color;
            
            this.drawNext();
            
            // Check game over
            if (this.collision()) {
                this.gameOver();
            }
        }

        collision(piece = this.currentPiece, x = this.currentX, y = this.currentY) {
            for (let row = 0; row < piece.shape.length; row++) {
                for (let col = 0; col < piece.shape[row].length; col++) {
                    if (piece.shape[row][col]) {
                        const newX = x + col;
                        const newY = y + row;
                        
                        if (newX < 0 || newX >= COLS || newY >= ROWS) {
                            return true;
                        }
                        
                        if (newY >= 0 && this.board[newY][newX]) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        movePiece(dx, dy) {
            this.currentX += dx;
            this.currentY += dy;
            
            if (this.collision()) {
                this.currentX -= dx;
                this.currentY -= dy;
                
                if (dy > 0) {
                    this.lockPiece();
                }
                return false;
            }
            return true;
        }

        rotatePiece() {
            const rotated = this.rotate(this.currentPiece.shape);
            const previousShape = this.currentPiece.shape;
            
            this.currentPiece.shape = rotated;
            
            if (this.collision()) {
                this.currentPiece.shape = previousShape;
            }
        }

        rotate(matrix) {
            const N = matrix.length;
            const M = matrix[0].length;
            const rotated = Array(M).fill().map(() => Array(N).fill(0));
            
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < M; j++) {
                    rotated[j][N - 1 - i] = matrix[i][j];
                }
            }
            return rotated;
        }

        hardDrop() {
            while (this.movePiece(0, 1)) {
                this.score += 2;
            }
            this.updateScore();
        }

        lockPiece() {
            for (let row = 0; row < this.currentPiece.shape.length; row++) {
                for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                    if (this.currentPiece.shape[row][col]) {
                        const y = this.currentY + row;
                        const x = this.currentX + col;
                        if (y >= 0) {
                            this.board[y][x] = this.currentPiece.typeId + 1;
                        }
                    }
                }
            }
            
            this.clearLines();
            this.spawnPiece();
        }

        clearLines() {
            let linesCleared = 0;
            
            for (let row = ROWS - 1; row >= 0; row--) {
                if (this.board[row].every(cell => cell > 0)) {
                    this.board.splice(row, 1);
                    this.board.unshift(Array(COLS).fill(0));
                    linesCleared++;
                    row++; // Check the same row again
                }
            }
            
            if (linesCleared > 0) {
                this.lines += linesCleared;
                this.score += this.calculateScore(linesCleared);
                this.level = Math.floor(this.lines / 10) + 1;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
                this.updateScore();
            }
        }

        calculateScore(lines) {
            const baseScores = [0, 100, 300, 500, 800];
            return baseScores[lines] * this.level;
        }

        updateScore() {
            this.scoreEl.textContent = this.score;
            this.linesEl.textContent = this.lines;
            this.levelEl.textContent = this.level;
        }

        gameOver() {
            this.gameRunning = false;
            this.finalScoreEl.textContent = this.score;
            this.gameOverOverlay.style.display = 'flex';
        }

        draw() {
            // Clear canvas
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw board
            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    if (this.board[row][col]) {
                        this.drawBlock(this.ctx, col, row, COLORS[this.board[row][col] - 1]);
                    }
                }
            }
            
            // Draw current piece
            if (this.currentPiece) {
                for (let row = 0; row < this.currentPiece.shape.length; row++) {
                    for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                        if (this.currentPiece.shape[row][col]) {
                            this.drawBlock(this.ctx, this.currentX + col, this.currentY + row, this.currentPiece.color);
                        }
                    }
                }
            }
            
            // Draw grid
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 1;
            for (let i = 0; i <= COLS; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(i * BLOCK_SIZE, 0);
                this.ctx.lineTo(i * BLOCK_SIZE, this.canvas.height);
                this.ctx.stroke();
            }
            for (let i = 0; i <= ROWS; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, i * BLOCK_SIZE);
                this.ctx.lineTo(this.canvas.width, i * BLOCK_SIZE);
                this.ctx.stroke();
            }
        }

        drawNext() {
            // Clear canvas
            this.nextCtx.fillStyle = '#000';
            this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
            
            if (this.nextPiece) {
                const blockSize = 25;
                const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
                const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
                
                for (let row = 0; row < this.nextPiece.shape.length; row++) {
                    for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                        if (this.nextPiece.shape[row][col]) {
                            this.drawBlock(this.nextCtx, 
                                offsetX / blockSize + col, 
                                offsetY / blockSize + row, 
                                this.nextPiece.color, 
                                blockSize);
                        }
                    }
                }
            }
        }

        drawBlock(ctx, x, y, color, size = BLOCK_SIZE) {
            ctx.fillStyle = color;
            ctx.fillRect(x * size, y * size, size, size);
            
            // Add 3D effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(x * size, y * size, size, 4);
            ctx.fillRect(x * size, y * size, 4, size);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(x * size, (y + 1) * size - 4, size, 4);
            ctx.fillRect((x + 1) * size - 4, y * size, 4, size);
        }
    }

    // Initialize game when module is loaded
    const game = new TetrisGame();
}
