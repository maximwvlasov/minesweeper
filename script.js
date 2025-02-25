// Ждём, пока Telegram WebApp будет готов
function waitForTelegram() {
    return new Promise((resolve) => {
        const checkTelegram = setInterval(() => {
            if (window.Telegram && window.Telegram.WebApp) {
                clearInterval(checkTelegram);
                resolve();
            }
        }, 100);
    });
}

// Настройки игры
const FIELD_SIZE = 8;
const MINES_COUNT = 10;
const POINTS_PER_CELL = 10;
let field = [];
let revealed = [];
let gameOver = false;
let score = 0;

// Элементы DOM
let gameField, scoreDiv, buttonContainer, leaderboardDiv;

waitForTelegram().then(() => {
    // Инициализация DOM элементов после загрузки Telegram
    gameField = document.getElementById('gameField');
    scoreDiv = document.getElementById('score');
    buttonContainer = document.getElementById('buttonContainer');
    leaderboardDiv = document.getElementById('leaderboard');

    // Проверка доступности Firebase
    if (!window.db || !window.firebaseFunctions) {
        console.error("Firebase не инициализирован! Проверьте подключение в HTML.");
        return;
    }

    // Функция для создания кнопки
    function createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.addEventListener('click', onClick);
        buttonContainer.appendChild(button);
        return button;
    }

    // Создаём кнопки
    createButton('Новая игра', startGame);
    createButton('Рейтинг', showLeaderboard);

    // Функция получения информации о пользователе
    function getUserInfo() {
        if (window.Telegram && window.Telegram.WebApp.initDataUnsafe?.user) {
            const user = window.Telegram.WebApp.initDataUnsafe.user;
            // Проверяем, есть ли у пользователя Telegram Premium (например, через is_premium, если доступно)
            const isPremium = user.is_premium || false; // Это поле может быть доступно в initDataUnsafe
            return {
                username: user.username || `anonymous_${Math.random().toString(36).substr(2, 9)}`,
                first_name: user.first_name || 'Аноним',
                is_premium: isPremium
            };
        } else {
            // В тестовом режиме генерируем анонимный идентификатор
            return {
                username: `anonymous_${Math.random().toString(36).substr(2, 9)}`,
                first_name: 'Аноним',
                is_premium: false
            };
        }
    }

    // Функция запроса разрешения на отображение имени в рейтинге
    function requestPermissionToShowName(user, callback) {
        const message = user.is_premium 
            ? 'Вы используете Telegram Premium. Разрешить отображение вашего имени в рейтинге?' 
            : 'Разрешить отображение вашего имени в рейтинге?';
        
        window.Telegram.WebApp.showPopup({
            title: 'Разрешение на рейтинг',
            message: message,
            buttons: [
                { id: 'yes', type: 'ok', text: 'Да' },
                { id: 'no', type: 'cancel', text: 'Нет' }
            ]
        }, (btn) => {
            if (btn.id === 'yes') {
                callback(true); // Пользователь разрешил показ имени
            } else {
                callback(false); // Пользователь запретил показ имени
            }
        });
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
        gameField.style.gridTemplateColumns = `repeat(${FIELD_SIZE}, 40px)`;
        for (let i = 0; i < FIELD_SIZE; i++) {
            for (let j = 0; j < FIELD_SIZE; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                if (revealed[i][j]) {
                    cell.classList.add('revealed');
                    if (field[i][j] === '💣') {
                        cell.classList.add('bomb');
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
        renderField(); // Убедимся, что поле перерендерируется
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

    // Функция сохранения счёта в Firebase по username с отладкой и запросом разрешения
    function saveScore() {
        const user = getUserInfo();
        console.log("Попытка сохранить счёт для пользователя:", user);
        if (!window.db || !window.firebaseFunctions) {
            console.error("Firebase не инициализирован! Проверьте подключение в HTML.");
            return;
        }
        const { ref, get, update } = window.firebaseFunctions;

        // Запрашиваем разрешение на отображение имени
        requestPermissionToShowName(user, (showName) => {
            if (showName) {
                // Пользователь разрешил показ имени
                const userRef = ref(window.db, `players/${user.username}`);
                get(userRef).then(snapshot => {
                    let currentScore = snapshot.exists() ? snapshot.val().totalScore || 0 : 0;
                    console.log("Текущий счёт в базе:", currentScore);
                    update(userRef, {
                        username: user.username,
                        totalScore: currentScore + score,
                        first_name: user.first_name
                    }).then(() => {
                        console.log("Счёт успешно сохранён для:", user.username);
                    }).catch(error => {
                        console.error("Ошибка сохранения счёта:", error);
                    });
                }).catch(error => console.error("Ошибка чтения данных из Firebase:", error));
            } else {
                // Пользователь запретил показ имени — сохраняем как аноним
                const anonUsername = `anonymous_${Math.random().toString(36).substr(2, 9)}`;
                const userRef = ref(window.db, `players/${anonUsername}`);
                get(userRef).then(snapshot => {
                    let currentScore = snapshot.exists() ? snapshot.val().totalScore || 0 : 0;
                    console.log("Текущий анонимный счёт в базе:", currentScore);
                    update(userRef, {
                        username: anonUsername,
                        totalScore: currentScore + score,
                        first_name: 'Аноним'
                    }).then(() => {
                        console.log("Анонимный счёт успешно сохранён для:", anonUsername);
                    }).catch(error => {
                        console.error("Ошибка сохранения анонимного счёта:", error);
                    });
                }).catch(error => console.error("Ошибка чтения анонимных данных из Firebase:", error));
            }
        });
    }

    // Функция показа рейтинга по username
    function showLeaderboard() {
        leaderboardDiv.style.display = 'block';
        leaderboardDiv.innerHTML = '<h3>Рейтинг игроков</h3>';
        if (!window.db || !window.firebaseFunctions) {
            console.error("Firebase не инициализирован! Проверьте подключение в HTML.");
            leaderboardDiv.innerHTML += '<p>Ошибка загрузки рейтинга</p>';
            return;
        }
        const { ref, get } = window.firebaseFunctions;
        get(ref(window.db, 'players')).then(snapshot => {
            if (snapshot.exists()) {
                const players = snapshot.val();
                const sortedPlayers = Object.entries(players)
                    .sort((a, b) => b[1].totalScore - a[1].totalScore)
                    .slice(0, 10);
                if (sortedPlayers.length > 0) {
                    sortedPlayers.forEach(([username, data]) => {
                        leaderboardDiv.innerHTML += `<p>${data.first_name || username}: ${data.totalScore}</p>`;
                    });
                } else {
                    leaderboardDiv.innerHTML += '<p>Пока нет игроков</p>';
                }
            } else {
                leaderboardDiv.innerHTML += '<p>Пока нет игроков</p>';
            }
            const closeButton = createButton('Закрыть', () => leaderboardDiv.style.display = 'none');
            leaderboardDiv.appendChild(closeButton);
        }).catch(error => {
            console.error("Ошибка загрузки рейтинга:", error);
            leaderboardDiv.innerHTML += '<p>Ошибка загрузки рейтинга</p>';
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

    // Запуск игры при загрузке
    document.addEventListener('DOMContentLoaded', startGame);

    // Адаптация темы под Telegram
    if (window.Telegram && window.Telegram.WebApp.themeParams) {
        const theme = window.Telegram.WebApp.themeParams;
        if (theme.bg_color) document.body.style.backgroundColor = theme.bg_color;
        if (theme.text_color) document.body.style.color = theme.text_color;
        if (theme.button_color) {
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => button.style.backgroundColor = theme.button_color);
        }
    }
}).catch(error => console.error("Ошибка при инициализации игры:", error));
    console.log("Исправленный скрипт загружен.");
});

