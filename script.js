import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCgxw8v14uSh924FW0ZoPFW8vXbltkhv9s",
    authDomain: "minesweeperbot-26c18.firebaseapp.com",
    databaseURL: "https://minesweeperbot-26c18-default-rtdb.firebaseio.com",
    projectId: "minesweeperbot-26c18",
    storageBucket: "minesweeperbot-26c18.appspot.com",
    messagingSenderId: "464398182383",
    appId: "1:464398182383:web:e4f2378178d89bad9fb81a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const FIELD_SIZE = 8;
const MINES_COUNT = 10;
const POINTS_PER_CELL = 10;
let field = [];
let revealed = [];
let gameOver = false;
let score = 0;

const gameField = document.createElement('div');
gameField.id = 'game-field';
document.body.appendChild(gameField);
gameField.style.display = 'grid';
gameField.style.gridTemplateColumns = `repeat(${FIELD_SIZE}, 40px)`;
gameField.style.gap = '2px';
gameField.style.marginTop = '10px';
gameField.style.border = '1px solid black';
gameField.style.padding = '10px';
gameField.style.backgroundColor = '#ddd';

const restartButton = document.createElement('button');
restartButton.textContent = 'Новая игра';
document.body.appendChild(restartButton);
restartButton.addEventListener('click', startGame);

const scoreDiv = document.createElement('div');
scoreDiv.id = 'score';
scoreDiv.style.position = 'absolute';
scoreDiv.style.top = '10px';
scoreDiv.style.left = '10px';
scoreDiv.style.fontSize = '20px';
scoreDiv.style.fontWeight = 'bold';
document.body.appendChild(scoreDiv);

const leaderboardButton = document.createElement('button');
leaderboardButton.textContent = 'Рейтинг';
document.body.appendChild(leaderboardButton);
leaderboardButton.addEventListener('click', showLeaderboard);

const leaderboardDiv = document.createElement('div');
leaderboardDiv.id = 'leaderboard';
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
    for (let i = 0; i < FIELD_SIZE; i++) {
        for (let j = 0; j < FIELD_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.width = '40px';
            cell.style.height = '40px';
            cell.style.border = '1px solid black';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.backgroundColor = '#fff';
            
            if (revealed[i][j]) {
                cell.style.backgroundColor = '#ccc';
                cell.textContent = field[i][j] === 0 ? '' : field[i][j];
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
        alert('Вы проиграли!');
        saveScore();
    } else {
        score += POINTS_PER_CELL;
        renderField();
        saveScore();
    }
}

function startGame() {
    gameOver = false;
    score = 0;
    createField();
    renderField();
}

function updateScore() {
    scoreDiv.textContent = `Очки: ${score}`;
}

function saveScore() {
    const userName = getUserName();
    set(ref(db, 'players/' + userName), { score });
}

function showLeaderboard() {
    get(ref(db, 'players')).then(snapshot => {
        if (snapshot.exists()) {
            const players = snapshot.val();
            leaderboardDiv.innerHTML = '<h3>Рейтинг игроков</h3>';
            Object.entries(players).sort((a, b) => b[1].score - a[1].score).forEach(([name, data]) => {
                leaderboardDiv.innerHTML += `<p>${name}: ${data.score}</p>`;
            });
            leaderboardDiv.style.display = 'block';
        }
    });
}

startGame();
