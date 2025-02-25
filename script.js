import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCgxw8v14uSh924FW0ZoPFW8vXbltkhv9s",
    authDomain: "minesweeperbot-26c18.firebaseapp.com",
    databaseURL: "https://minesweeperbot-26c18-default-rtdb.firebaseio.com",
    projectId: "minesweeperbot-26c18",
    storageBucket: "minesweeperbot-26c18.appspot.com",
    messagingSenderId: "464398182383",
    appId: "1:464398182383:web:e4f2378178d89bad9fb81a",
    measurementId: "G-7577HNBGVP"
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

const gameField = document.getElementById('game-field');
gameField.style.display = 'grid';
gameField.style.gridTemplateColumns = `repeat(${FIELD_SIZE}, 40px)`;
gameField.style.gap = '2px';

gameField.style.marginTop = '10px';

gameField.style.border = '1px solid black';

gameField.style.padding = '10px';

gameField.style.backgroundColor = '#ddd';

const restartButton = document.getElementById('restart');
const statusDiv = document.getElementById('status');
const scoreDiv = document.createElement('div');
scoreDiv.id = 'score';
scoreDiv.style.marginTop = '10px';
scoreDiv.style.fontSize = '20px';
scoreDiv.style.fontWeight = 'bold';
document.body.insertBefore(scoreDiv, gameField);

const leaderboardButton = document.createElement('button');
leaderboardButton.textContent = 'Показать рейтинг';
leaderboardButton.style.marginTop = '10px';
leaderboardButton.style.display = 'block';
document.body.insertBefore(leaderboardButton, restartButton.nextSibling);

const leaderboardDiv = document.createElement('div');
leaderboardDiv.id = 'leaderboard';
leaderboardDiv.style.marginTop = '10px';
leaderboardDiv.style.fontSize = '16px';
leaderboardDiv.style.display = 'none';
document.body.insertBefore(leaderboardDiv, leaderboardButton.nextSibling);

window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();

function getUserName() {
    return window.Telegram.WebApp.initDataUnsafe?.user?.first_name || 'Аноним';
}

function saveScore() {
    const username = getUserName();
    set(ref(db, 'leaderboard/' + username), {
        username: username,
        score: score
    });
}

leaderboardButton.addEventListener('click', async () => {
    const leaderboardRef = ref(db, 'leaderboard');
    get(leaderboardRef).then((snapshot) => {
        if (snapshot.exists()) {
            let data = snapshot.val();
            let sortedLeaderboard = Object.values(data).sort((a, b) => b.score - a.score);
            leaderboardDiv.innerHTML = '<b>Рейтинг игроков:</b><br>' +
                sortedLeaderboard.map((entry, index) => `${index + 1}. ${entry.username}: ${entry.score}`).join('<br>');
            leaderboardDiv.style.display = 'block';
        } else {
            leaderboardDiv.innerHTML = "Рейтинг пуст.";
        }
    });
});

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
}

function openCell(x, y) {
    if (gameOver || revealed[x][y]) return;
    
    revealed[x][y] = true;
    
    renderField();
}

function startGame() {
    gameOver = false;
    statusDiv.textContent = '';
    field = Array(FIELD_SIZE).fill().map(() => Array(FIELD_SIZE).fill(0));
    revealed = Array(FIELD_SIZE).fill().map(() => Array(FIELD_SIZE).fill(false));
    renderField();
}

restartButton.addEventListener('click', startGame);

startGame();
