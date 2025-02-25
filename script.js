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

// Создаём контейнер для кнопок
const buttonContainer = document.createElement('div');
buttonContainer.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 15px;
    margin: 20px 0;
`;
document.body.appendChild(buttonContainer);

// Функция для создания кнопки
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

// Создаём кнопки "Новая игра" и "Рейтинг"
createButton('Новая игра', startGame);
createButton('Рейтинг', showLeaderboard);

// Создаём элемент для отображения счёта
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

// Создаём элемент для отображения рейтинга
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

// Проверяем, работает ли Telegram WebApp, и инициализируем его, если доступен
try {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        console.log("Telegram WebApp инициализирован");
    } else {
        console.log("Telegram WebApp не найден, работаем в обычном режиме");
    }
} catch (error) {
    console.warn("Ошибка при инициализации Telegram WebApp:", error);
    // Продолжаем работу без Telegram
}

// Функция получения информации о пользователе
function getUserInfo() {
    // Пробуем получить данные из Telegram, если доступно
    if (window.Telegram && window.Telegram.WebApp.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        return {
            id: user.id || 'anonymous_' + Math.random().toString(36).substr(2, 9), // Уникальный ID, если Telegram не предоставляет
            username: user.username || user.first_name || 'Аноним'
        };
    } else {
        // Если Telegram недоступен, генерируем временный ID и имя
        return {
            id: 'anonymous_' + Math.random().toString(36).substr(2, 9),
            username: 'Аноним'
        };
    }
}

// Функция создания игрового поля с минами
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

// Функция отрисовки игрового поля
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
                transition: background 0.2s;
            `;
            if (revealed[i][j]) {
                cell.textContent = field[i][j] === 0 ? '' : field[i][j];
                if (field[i][j] === '💣') {
                    cell.style.background = '#ff4d4d';
                    cell.textContent = '💣';
                }
            }
            cell.addEventListener('mouseover', () => {
                if (!revealed[i][j] && !gameOver) cell.style.background = '#f0f0f0';
            });
            cell.addEventListener('mouseout', () => {
                if (!revealed[i][j] && !gameOver) cell.style.background = '#fff';
            });
            cell.addEventListener('click', () => openCell(i, j));
            gameField.appendChild(cell);
        }
    }
    updateScore();
}

// Функция открытия ячейки
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

// Функция показа всех мин
function revealAll() {
    for (let i = 0; i < FIELD_SIZE; i++) {
        for (let j = 0; j < FIELD_SIZE; j++) {
            revealed[i][j] = true;
        }
    }
    renderField();
}

// Функция проверки победы
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

// Функция обновления счёта на экране
function updateScore() {
    scoreDiv.textContent = `Счёт: ${score}`;
}

// Функция сохранения счёта в Firebase
function saveScore() {
    const user = getUserInfo();
    const userRef = ref(db, `players/${user.id}`);
    console.log("Сохранение счёта для пользователя:", user, "с счётом:", score);
    get(userRef).then(snapshot => {
        let currentScore = snapshot.exists() ? snapshot.val().totalScore || 0 : 0;
        update(userRef, {
            username: user.username,
            totalScore: currentScore + score
        }).then(() => {
            console.log("Счёт успешно сохранён для пользователя:", user.id);
        }).catch(error => console.error("Ошибка сохранения счёта:", error));
    }).catch(error => console.error("Ошибка загрузки счёта:", error));
}

// Функция показа рейтинга
function showLeaderboard() {
    console.log("Загрузка рейтинга...");
    get(ref(db, 'players')).then(snapshot => {
        leaderboardDiv.innerHTML = '<h3 style="color: #333;">Рейтинг игроков</h3>';
        if (snapshot.exists()) {
            const players = snapshot.val();
            const sortedPlayers = Object.entries(players)
                .sort((a, b) => b[1].totalScore - a[1].totalScore) // Сортировка по убыванию счёта
                .slice(0, 10); // Берем топ-10
            if (sortedPlayers.length > 0) {
                sortedPlayers.forEach(([id, data]) => {
                    leaderboardDiv.innerHTML += `<p>${data.username}: ${data.totalScore}</p>`;
                });
            } else {
                leaderboardDiv.innerHTML += '<p>Пока нет игроков</p>';
            }
        } else {
            leaderboardDiv.innerHTML += '<p>Пока нет игроков</p>';
        }
        leaderboardDiv.style.display = 'block';
        // Добавляем кнопку "Закрыть" для рейтинга
        const closeButton = createButton('Закрыть', () => leaderboardDiv.style.display = 'none');
        leaderboardDiv.appendChild(closeButton);
    }).catch(error => {
        console.error("Ошибка загрузки рейтинга:", error);
        leaderboardDiv.innerHTML = '<p>Ошибка загрузки рейтинга</p>';
        leaderboardDiv.style.display = 'block';
    });
}

// Функция начала новой игры
function startGame() {
    gameOver = false;
    score = 0;
    createField();
    renderField();
    leaderboardDiv.style.display = 'none';
}

// Запускаем игру при загрузке
startGame();
