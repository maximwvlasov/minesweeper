// Импортируем Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCgxw8v14uSh924FW0ZoPFW8vXbltkhv9s",
    authDomain: "minesweeperbot-26c18.firebaseapp.com",
    databaseURL: "https://minesweeperbot-26c18-default-rtdb.firebaseio.com",
    projectId: "minesweeperbot-26c18",
    storageBucket: "minesweeperbot-26c18.appspot.com",
    messagingSenderId: "464398182383",
    appId: "1:464398182383:web:e4f2378178d89bad9fb81a"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Настройки игры
const FIELD_SIZE = 8;
const MINES_COUNT = 10;
const POINTS_PER_CELL = 10;
let field = [];
let revealed = [];
let gameOver = false;
let score = 0;

// Создаём игровое поле
document.addEventListener('DOMContentLoaded', () => {
    startGame();
});

const gameField = document.createElement('div');
gameField.id = 'game-field';
document.body.appendChild(gameField);
gameField.style.cssText = `
    display: grid;
    grid-template-columns: repeat(${FIELD_SIZE}, 50px);
    gap: 4px;
    margin: 20px auto;
    padding: 15px;
    background: #e0e0e0;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    width: fit-content;
`;

// Контейнер для кнопок
const buttonContainer = document.createElement('div');
buttonContainer.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 15px;
    padding: 20px 0;
`;
document.body.appendChild(buttonContainer);

// Функция создания кнопки
const createButton = (text, onClick) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
        padding: 12px 24px;
        font-size: 16px;
        cursor: pointer;
        border: none;
        border-radius: 8px;
        background: #28a745;
        color: white;
        transition: background 0.3s;
    `;
    button.addEventListener('mouseover', () => button.style.background = '#218838');
    button.addEventListener('mouseout', () => button.style.background = '#28a745');
    button.addEventListener('click', onClick);
    buttonContainer.appendChild(button);
    return button;
};

createButton('Новая игра', startGame);
createButton('Рейтинг', showLeaderboard);

// Элементы интерфейса
const scoreDiv = document.createElement('div');
scoreDiv.id = 'score';
scoreDiv.style.cssText = `
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin: 10px 0;
    color: #333;
`;
document.body.appendChild(scoreDiv);

const leaderboardDiv = document.createElement('div');
leaderboardDiv.id = 'leaderboard';
leaderboardDiv.style.cssText = `
    display: none;
    margin: 20px auto;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    width: 300px;
    max-height: 400px;
    overflow-y: auto;
    color: #333;
`;
document.body.appendChild(leaderboardDiv);

// Функция получения информации о пользователе
function getUserInfo() {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        return { id: user.id, username: user.username || user.first_name || 'Аноним' };
    }
    return { id: 'anonymous_' + Math.random().toString(36).substr(2,9), username: 'Аноним' };
}

// Функция начала новой игры
function startGame() {
    console.log("Новая игра началась!");
    gameOver = false;
    score = 0;
    createField();
    renderField();
    leaderboardDiv.style.display = 'none';
}

// Функция создания игрового поля
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
        }
    }
}

// Функция отображения игрового поля
function renderField() {
    gameField.innerHTML = '';
    for (let i = 0; i < FIELD_SIZE; i++) {
        for (let j = 0; j < FIELD_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.cssText = `
                width: 50px;
                height: 50px;
                border: 2px solid #999;
                border-radius: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: ${revealed[i][j] ? '#d9d9d9' : '#fff'};
                font-size: 20px;
                cursor: ${gameOver ? 'default' : 'pointer'};
            `;
            if (revealed[i][j]) {
                cell.textContent = field[i][j] === 0 ? '' : field[i][j];
                if (field[i][j] === '💣') {
                    cell.style.background = '#ff4d4d';
                }
            }
            cell.addEventListener('click', () => openCell(i, j));
            gameField.appendChild(cell);
        }
    }
    updateScore();
}

// Функция обновления счёта
function updateScore() {
    scoreDiv.textContent = `Счёт: ${score}`;
}
