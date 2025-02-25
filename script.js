const FIELD_SIZE = 8;
const MINES_COUNT = 10;
let field = [];
let revealed = [];
let gameOver = false;

const gameField = document.getElementById('game-field');
const restartButton = document.getElementById('restart');
const statusDiv = document.getElementById('status');

window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();

function createField() {
    field = Array(FIELD_SIZE).fill().map(() => Array(FIELD_SIZE).fill(0));
    revealed = Array(FIELD_SIZE).fill().map(() => Array(FIELD_SIZE).fill(false));
    
    let mines = 0;
    while (mines < MINES_COUNT) {
        const x = Math.floor(Math.random() * FIELD_SIZE);
        const y = Math.floor(Math.random() * FIELD_SIZE);
        if (field[x][y] !== '💣') {
            field[x][y] = '💣';
            mines++;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const newX = x + dx;
                    const newY = y + dy;
                    if (newX >= 0 && newX < FIELD_SIZE && newY >= 0 && newY < FIELD_SIZE && field[newX][newY] !== '💣') {
                        field[newX][newY]++;
                    }
                }
            }
        }
    }
}

function renderField() {
    gameField.innerHTML = '';
    gameField.style.gridTemplateColumns = `repeat(${FIELD_SIZE}, 40px)`;
    for (let i = 0; i < FIELD_SIZE; i++) {
        for (let j = 0; j < FIELD_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (revealed[i][j]) {
                cell.classList.add('revealed');
                cell.textContent = field[i][j] === 0 ? '' : field[i][j];
            }
            cell.addEventListener('click', () => openCell(i, j));
            gameField.appendChild(cell);
        }
    }
}

function openCell(x, y) {
    if (gameOver || revealed[x][y]) return;
    
    revealed[x][y] = true;
    if (field[x][y] === '💣') {
        gameOver = true;
        statusDiv.textContent = 'Вы проиграли!';
        revealAll();
    } else {
        renderField();
        checkWin();
    }
}

function checkWin() {
    let closedCells = 0;
    for (let i = 0; i < FIELD_SIZE; i++) {
        for (let j = 0; j < FIELD_SIZE; j++) {
            if (!revealed[i][j] && field[i][j] !== '💣') closedCells++;
        }
    }
    if (closedCells === 0) {
        gameOver = true;
        statusDiv.textContent = 'Вы выиграли!';
    }
}

function revealAll() {
    revealed = revealed.map(row => row.map(() => true));
    renderField();
}

function startGame() {
    gameOver = false;
    statusDiv.textContent = '';
    createField();
    renderField();
}

restartButton.addEventListener('click', startGame);

startGame();