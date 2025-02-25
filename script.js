import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCgxw8v...",
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
gameField.style.cssText = `
    display: grid;
    grid-template-columns: repeat(${FIELD_SIZE}, 50px);
    gap: 4px;
    margin: 20px auto;
`;

const scoreDiv = document.createElement('div');
scoreDiv.id = 'score';
scoreDiv.style.cssText = `text-align: center; font-size: 24px; font-weight: bold;`;
document.body.appendChild(scoreDiv);

window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();

function getUserInfo() {
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    return {
        id: user?.id || 'anonymous_' + Math.random().toString(36).substr(2, 9),
        username: user?.username || user?.first_name || 'Аноним'
    };
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
            cell.style.cssText = `
                width: 50px; height: 50px; border: 2px solid #999;
                display: flex; align-items: center; justify-content: center;
                background: ${revealed[i][j] ? '#d9d9d9' : '#fff'};
                font-size: 20px; cursor: ${gameOver ? 'default' : 'pointer'};
            `;
            if (revealed[i][j]) {
                cell.textContent = field[i][j] === 0 ? '' : field[i][j];
                if (field[i][j] === '💣') {
                    cell.style.background = '#ff4d4d';
                    cell.textContent = '💣';
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
        alert(`Игра окончена! Ваш счёт: ${score}`);
        saveScore();
        revealAll();
    } else {
        score += POINTS_PER_CELL;
        if (field[x][y] === 0) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const newX = x + dx;
                    const newY = y + dy;
                    if (newX >= 0 && newX < FIELD_SIZE && newY >= 0 && newY < FIELD_SIZE) {
                        openCell(newX, newY);
                    }
                }
            }
        }
        renderField();
        checkWin();
    }
}

function revealAll() {
    for (let i = 0; i < FIELD_SIZE; i++) {
        for (let j = 0; j < FIELD_SIZE; j++) {
            revealed[i][j] = true;
        }
    }
    renderField();
}

function checkWin() {
    let unrevealed = 0;
    for (let i = 0; i < FIELD_SIZE; i++) {
        for (let j = 0; j < FIELD_SIZE; j++) {
            if (!revealed[i][j] && field[i][j] !== '💣') unrevealed++;
        }
    }
    if (unrevealed === 0) {
        gameOver = true;
        alert(`Победа! Ваш счёт: ${score}`);
        saveScore();
    }
}

function updateScore() {
    scoreDiv.textContent = `Счёт: ${score}`;
}

function saveScore() {
    const user = getUserInfo();
    const userRef = ref(db, `players/${user.id}`);

    get(userRef).then(snapshot => {
        let currentScore = snapshot.exists() ? snapshot.val().bestScore || 0 : 0;
        if (score > currentScore) {
            update(userRef, {
                username: user.username,
                bestScore: score
            }).then(() => {
                console.log("Лучший результат обновлён для:", user.username);
            }).catch(error => console.error("Ошибка сохранения счёта:", error));
        }
    }).catch(error => console.error("Ошибка загрузки счёта:", error));
}

function startGame() {
    gameOver = false;
    score = 0;
    createField();
    renderField();
}

startGame();
