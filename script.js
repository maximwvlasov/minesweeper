// Ждёт, пока Telegram WebApp будет готов
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

// Функция для получения параметров из URL (если нужны в будущем)
function getUserInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        username: urlParams.get('username') || `anonymous_${Math.random().toString(36).substr(2, 9)}`,
        first_name: urlParams.get('first_name') || 'Аноним'
    };
}

// Настройки игры
const FIELD_SIZE = 8;
const MINES_COUNT = 10;
const POINTS_PER_CELL = 10;
field = [];
let revealed = [];
let gameOver = false;
let score = 0;
// Элементы DOM
let gameField, scoreDiv, buttonContainer, leaderboardDiv, startButton, startMenu, minesweeperLaunch, backButton, leaderboardContainer, leaderboardContent, playerPosition, playerTotalScore, playerLeaderboardName;
// Ожидание инициализации Telegram WebApp
waitForTelegram().then(() => {
    console.log("Telegram WebApp инициализирован");
    // Инициализация DOM элементов
    startButton = document.getElementById('start-button');
    startMenu = document.getElementById('start-menu');
    minesweeperLaunch = document.getElementById('minesweeper-launch');
    gameField = document.getElementById('gameField');
    scoreDiv = document.getElementById('score');
    buttonContainer = document.getElementById('buttonContainer');
    leaderboardDiv = document.getElementById('leaderboard');
    leaderboardContainer = document.getElementById('leaderboard-container');
    backButton = document.getElementById('back-button');
    leaderboardContent = document.getElementById('leaderboard-content');
    playerPosition = document.getElementById('player-position');
    playerTotalScore = document.getElementById('player-total-score');
    playerLeaderboardName = document.getElementById('player-leaderboard-name');
    // Проверка существования элементов
    if (!startButton || !startMenu || !minesweeperLaunch || !gameField || !leaderboardContainer || !backButton) {
        console.error("Один или несколько DOM-элементов не найдены!");
        return;
    }
    // Скрываем все контейнеры по умолчанию
    document.getElementById('taskbar').style.display = 'flex';
    document.getElementById('game-container').classList.remove('active');
    document.getElementById('leaderboard-container').classList.remove('active');
    // Обработчики для меню Start
    startButton.addEventListener('click', () => {
        startMenu.style.display = startMenu.style.display === 'block' ? 'none' : 'block';
    });
    minesweeperLaunch.addEventListener('click', () => {
        startMenu.style.display = 'none'; // Скрываем меню
        document.getElementById('game-container').classList.add('active'); // Показываем игру
        document.getElementById('leaderboard-container').classList.remove('active'); // Скрываем рейтинг
        startGame();
        console.log("Запуск игры 'Сапёр'...");
    });
    backButton.addEventListener('click', () => {
        document.getElementById('game-container').classList.remove('active'); // Скрываем игру
        document.getElementById('leaderboard-container').classList.remove('active'); // Скрываем рейтинг
        startMenu.style.display = 'block'; // Показываем меню
    });
    // Ваша остальная логика здесь...
});

    // Проверка существования элементов
    if (!startButton || !startMenu || !minesweeperLaunch || !gameField || !leaderboardContainer || !backButton) {
        console.error("Один или несколько DOM-элементов не найдены!");
        return;
    }

    // Активируем только панель задач и скрываем всё остальное по умолчанию
    document.getElementById('taskbar').style.display = 'flex';
    document.getElementById('game-container').classList.remove('active');
    document.getElementById('leaderboard-container').classList.remove('active');

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

    // Создаём кнопки в игре (будут видны только после запуска игры)
    createButton('Новая игра', startGame);
    createButton('Рейтинг', () => showLeaderboard(true));

    // Обработчики для меню Start
    startButton.addEventListener('click', () => {
        startMenu.style.display = startMenu.style.display === 'block' ? 'none' : 'block';
    });

    minesweeperLaunch.addEventListener('click', () => {
        startMenu.style.display = 'none';
        document.getElementById('game-container').classList.add('active');
        document.getElementById('leaderboard-container').classList.remove('active');
        startGame();
        console.log("Запуск игры 'Сапёр'...");
    });

    backButton.addEventListener('click', () => {
        document.getElementById('game-container').classList.remove('active');
        document.getElementById('leaderboard-container').classList.remove('active');
        startMenu.style.display = 'none'; // Скрываем меню при возврате
    });

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
        gameField.style.gridTemplateColumns = `repeat(${FIELD_SIZE}, 32px)`;
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
            saveScore().then(totalScore => {
                showGameResult(score, totalScore);
            });
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
            saveScore().then(totalScore => {
                showGameResult(score, totalScore);
            });
        }
    }

    // Функция обновления счёта на экране
    function updateScore() {
        scoreDiv.textContent = `Счёт: ${score}`;
    }

    // Функция показа результатов игры
    function showGameResult(finalScore, totalScore) {
        window.Telegram.WebApp.showPopup({
            title: 'Результат игры',
            message: `Игра окончена! Ваш счёт в этой игре: ${finalScore}\nОбщая сумма очков: ${totalScore}`,
            buttons: [
                { id: 'playAgain', type: 'ok', text: 'Ещё играть' }
            ]
        }, (btn) => {
            if (btn.id === 'playAgain') {
                startGame(); // Начать новую игру
            }
        });
    }

    // Функция сохранения счёта в Firebase по username с отладкой (возвращает общую сумму очков)
    function saveScore() {
        return new Promise((resolve) => {
            const user = getUserInfo();
            console.log("Попытка сохранить счёт для пользователя:", user);
            if (!window.db || !window.firebaseFunctions) {
                console.error("Firebase не инициализирован! Проверьте подключение в HTML.");
                resolve(0);
                return;
            }
            const { ref, get, update } = window.firebaseFunctions;
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
                    resolve(currentScore + score); // Возвращаем новую сумму очков
                }).catch(error => {
                    console.error("Ошибка сохранения счёта:", error);
                    resolve(0);
                });
            }).catch(error => {
                console.error("Ошибка чтения данных из Firebase:", error);
                resolve(0);
            });
        });
    }

    // Функция показа рейтинга по username
    function showLeaderboard(showFullScreen = false) {
        if (showFullScreen) {
            document.getElementById('game-container').classList.remove('active');
            document.getElementById('leaderboard-container').classList.add('active');
        } else {
            leaderboardDiv.style.display = 'block';
        }

        if (!window.db || !window.firebaseFunctions) {
            console.error("Firebase не инициализирован! Проверьте подключение в HTML.");
            if (showFullScreen) {
                leaderboardContent.innerHTML = '<p>Ошибка загрузки рейтинга</p>';
            } else {
                leaderboardDiv.innerHTML = '<p>Ошибка загрузки рейтинга</p>';
            }
            return;
        }
        const { ref, get } = window.firebaseFunctions;
        get(ref(window.db, 'players')).then(snapshot => {
            if (snapshot.exists()) {
                const players = snapshot.val();
                const sortedPlayers = Object.entries(players)
                    .sort((a, b) => b[1].totalScore - a[1].totalScore)
                    .map((entry, index) => ({ ...entry[1], position: index + 1 }));
                if (sortedPlayers.length > 0) {
                    let html = '';
                    sortedPlayers.forEach(player => {
                        html += `<p>${player.position}. ${player.first_name || player.username}: ${player.totalScore}</p>`;
                    });

                    if (showFullScreen) {
                        leaderboardContent.innerHTML = html;
                        // Устанавливаем данные текущего игрока в заголовке рейтинга
                        const user = getUserInfo();
                        const currentPlayer = sortedPlayers.find(p => p.username === user.username);
                        playerPosition.textContent = currentPlayer ? currentPlayer.position : '-';
                        playerTotalScore.textContent = currentPlayer ? currentPlayer.totalScore : '0';
                        playerLeaderboardName.textContent = user.first_name;
                    } else {
                        leaderboardDiv.innerHTML = `<h3>Рейтинг игроков</h3>${html}`;
                    }
                } else {
                    if (showFullScreen) {
                        leaderboardContent.innerHTML = '<p>Пока нет игроков</p>';
                    } else {
                        leaderboardDiv.innerHTML = '<p>Пока нет игроков</p>';
                    }
                }
            } else {
                if (showFullScreen) {
                    leaderboardContent.innerHTML = '<p>Пока нет игроков</p>';
                } else {
                    leaderboardDiv.innerHTML = '<p>Пока нет игроков</p>';
                }
            }
            if (!showFullScreen) {
                const closeButton = createButton('Закрыть', () => leaderboardDiv.style.display = 'none');
                leaderboardDiv.appendChild(closeButton);
            }
        }).catch(error => {
            console.error("Ошибка загрузки рейтинга:", error);
            if (showFullScreen) {
                leaderboardContent.innerHTML = '<p>Ошибка загрузки рейтинга</p>';
            } else {
                leaderboardDiv.innerHTML = '<p>Ошибка загрузки рейтинга</p>';
            }
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
}).catch(error => console.error("Ошибка при инициализации игры:", error));
