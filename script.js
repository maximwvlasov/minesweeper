const FIELD_SIZE = 8;
const MINES_COUNT = 10;
const POINTS_PER_CELL = 10;
let field = [];
let revealed = [];
let gameOver = false;
let score = localStorage.getItem('score') ? parseInt(localStorage.getItem('score')) : 0;
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

const gameField = document.getElementById('game-field');
const restartButton = document.getElementById('restart');
const statusDiv = document.getElementById('status');

// Создаём счётчик очков
const scoreDiv = document.createElement('div');
scoreDiv.id = 'score';
scoreDiv.style.position = 'absolute';
scoreDiv.style.top = '10px';
scoreDiv.style.left = '10px';
scoreDiv.style.fontSize = '20px';
scoreDiv.style.fontWeight = 'bold';
document.body.appendChild(scoreDiv);

// Кнопка рейтинга
const leaderboardButton = document.createElement('button');
leaderboardButton.textContent = 'Мой рейтинг';
leaderboardButton.style.position = 'absolute';
leaderboardButton.style.top = '40px';
leaderboardButton.style.left = '10px';
document.body.appendChild(leaderboardButton);

// Окно с рейтингом
const leaderboardDiv = document.createElement('div');
leaderboardDiv.id = 'leaderboard';
leaderboardDiv.style.position = 'absolute';
leaderboardDiv.style.top = '80px';
leaderboardDiv.style.left = '10px';
leaderboardDiv.style.fontSize = '16px';
leaderboardDiv.style.display = 'none';
document.body.appendChild(leaderboardDiv);

window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();

function getUserName() {
    return window.Telegram.WebApp.initDataUnsafe?.user?.first_name || 'Аноним';
}

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
                if (field[i][j] === '💣') {
                    cell.textContent = '💣';
                } else {
                    cell.textContent = field[i][j] === 0 ? '' : field[i][j];
                }
            }
            cell.addEventListener('click', () => openCell(i, j));
            gameField.appendChild(cell);
        }
    }
    updateScore();
}

function openCell(x, y) {
    if (gameOver || revealed[x][y]) return;
    
    revealed[x][y] = true;
    
    if (field[x][y] === '💣') {
        gameOver = true;
        statusDiv.textContent = 'Вы проиграли!';
        revealAll();
        saveScore();
    } else {
        score += POINTS_PER_CELL; // Начисляем очки
        localStorage.setItem('score', score);
        renderField();
        checkWin();
    }
}

function saveScore() {
    const username = getUserName();
    leaderboard = leaderboard.filter(entry => entry.username !== username);
    leaderboard.push({ username, score });
    leaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

leaderboardButton.addEventListener('click', () => {
    leaderboardDiv.style.display = leaderboardDiv.style.display === 'none' ? 'block' : 'none';
    leaderboardDiv.innerHTML = '<b>Рейтинг игроков:</b><br>' + leaderboard.map((entry, index) => `${index + 1}. ${entry.username}: ${entry.score}`).join('<br>');
});

function startGame() {
    gameOver = false;
    statusDiv.textContent = '';
    createField();
    renderField();
}

restartButton.addEventListener('click', startGame);

startGame();
