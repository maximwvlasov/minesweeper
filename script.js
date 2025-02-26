// Ждём загрузки Telegram WebApp
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

waitForTelegram().then(() => {
    console.log("Telegram WebApp инициализирован");

    // Получаем элементы
    const startButton = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');
    const minesweeperLaunch = document.getElementById('minesweeper-launch');
    const ratingLaunch = document.getElementById('rating-launch');
    const gameContainer = document.getElementById('game-container');
    const gameField = document.getElementById('gameField');
    const scoreElement = document.getElementById('score');
    const taskbar = document.getElementById('taskbar');
    const ratingContainer = document.getElementById('rating-container');
    const ratingBody = document.getElementById('rating-body');
    const closeRating = document.getElementById('close-rating');

    // Инициализация состояния
    let totalScore = 0;
    let gameActive = false;

    // Устанавливаем начальное состояние
    taskbar.style.display = 'flex';
    startMenu.style.display = 'none';
    gameContainer.style.display = 'none';
    ratingContainer.style.display = 'none';

    // Получаем данные игрока из Telegram
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    const playerName = user?.username || user?.first_name || 'Аноним';
    const userId = user?.id || 'default_user';
    console.log('Пользователь:', { userId, playerName });

    // Получаем данные из Firebase
    function loadScoreFromFirebase() {
        const scoreRef = window.firebaseFunctions.ref(window.db, `scores/${userId}`);
        window.firebaseFunctions.get(scoreRef).then((snapshot) => {
            console.log('Данные из Firebase:', snapshot.val());
            if (snapshot.exists()) {
                const data = snapshot.val();
                totalScore = Number(data.score) || 0; // Принудительное преобразование в число
            } else {
                totalScore = 0; // Устанавливаем 0, если записи нет
                // Создаём запись для нового игрока, если её нет
                window.firebaseFunctions.set(scoreRef, { score: 0, name: playerName }).then(() => {
                    console.log('Создан новый игрок в Firebase:', userId);
                }).catch((error) => {
                    console.error('Ошибка создания записи в Firebase:', error);
                });
            }
            updateScoreDisplay();
        }).catch((error) => {
            console.error('Ошибка загрузки счёта из Firebase:', error);
            totalScore = 0;
            updateScoreDisplay();
        });
    }

    // Сохраняем данные в Firebase
    function saveScoreToFirebase() {
        const scoreRef = window.firebaseFunctions.ref(window.db, `scores/${userId}`);
        window.firebaseFunctions.update(scoreRef, { score: totalScore, name: playerName }).catch((error) => {
            console.error('Ошибка сохранения счёта в Firebase:', error);
        });
    }

    // Обновляем отображение счёта
    function updateScoreDisplay() {
        scoreElement.textContent = `Счёт: ${totalScore}`;
    }

    // Загружаем и отображаем рейтинг
    function loadAndDisplayRating() {
        const scoresRef = window.firebaseFunctions.ref(window.db, 'scores');
        const scoresQuery = window.firebaseFunctions.query(scoresRef, window.firebaseFunctions.orderByChild('score'), window.firebaseFunctions.limitToLast(10)); // Топ-10 игроков
        window.firebaseFunctions.get(scoresQuery).then((snapshot) => {
            if (snapshot.exists()) {
                const scores = Object.entries(snapshot.val()).map(([id, data]) => ({
                    name: data.name || `Игрок ${id}`,
                    score: Number(data.score) || 0 // Принудительное преобразование в число
                })).sort((a, b) => b.score - a.score);

                ratingBody.innerHTML = '';
                scores.forEach((player, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${player.name}</td>
                        <td>${player.score}</td>
                    `;
                    ratingBody.appendChild(row);
                });
            }
        }).catch((error) => {
            console.error('Ошибка загрузки рейтинга из Firebase:', error);
        });
    }

    // Обработчик для кнопки "Start"
    startButton.addEventListener('click', () => {
        startMenu.style.display = startMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Обработчик для кнопки "Сапёр"
    minesweeperLaunch.addEventListener('click', () => {
        startMenu.style.display = 'none';
        gameContainer.style.display = 'block';
        gameActive = true;
        initializeGame();
        loadScoreFromFirebase(); // Загружаем текущий счёт при старте игры
    });

    // Обработчик для кнопки "Рейтинг"
    ratingLaunch.addEventListener('click', () => {
        if (gameActive) {
            gameContainer.style.display = 'none';
        } else {
            startMenu.style.display = 'none';
        }
        ratingContainer.style.display = 'block';
        loadAndDisplayRating();
    });

    // Обработчик для кнопки "Закрыть" в рейтинге
    closeRating.addEventListener('click', () => {
        ratingContainer.style.display = 'none';
        if (gameActive) {
            gameContainer.style.display = 'block';
        } else {
            startMenu.style.display = 'block';
        }
    });

    // Инициализация игры
    function initializeGame() {
        gameField.innerHTML = '';
        const rows = 8;
        const cols = 8;
        const totalCells = rows * cols;
        const bombCount = 10; // Количество мин

        // Генерируем случайные позиции для мин
        const bombs = new Set();
        while (bombs.size < bombCount) {
            bombs.add(Math.floor(Math.random() * totalCells));
        }

        // Создаём игровое поле
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                const cellIndex = i * cols + j;

                if (bombs.has(cellIndex)) {
                    cell.dataset.isBomb = true;
                }

                cell.addEventListener('click', handleCellClick);
                cell.addEventListener('contextmenu', handleRightClick); // Для установки флага правой кнопкой
                cell.addEventListener('touchstart', handleTouchStart); // Для мобильных устройств
                gameField.appendChild(cell);
            }
        }

        gameField.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
    }

    // Обработчик клика по ячейке (левая кнопка)
    function handleCellClick(event) {
        event.preventDefault();
        const cell = event.target;
        if (cell.classList.contains('revealed') || cell.classList.contains('flagged')) return;

        cell.classList.add('revealed');

        if (cell.dataset.isBomb) {
            cell.classList.add('bomb');
            cell.textContent = '💣';
            alert('Вы проиграли! Нажмите "Start" для новой игры.');
            gameActive = false;
            revealAllBombs();
            saveScoreToFirebase(); // Сохраняем счёт после игры
        } else {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            let bombCount = countNeighborBombs(row, col);

            if (bombCount > 0) {
                cell.textContent = bombCount;
            }

            // Начисляем 10 очков за каждую открытую ячейку без бомбы
            totalScore += 10;
            updateScoreDisplay();
            checkWin();
        }
    }

    // Обработчик правого клика (установка флага)
    function handleRightClick(event) {
        event.preventDefault();
        const cell = event.target;
        if (cell.classList.contains('revealed')) return;

        if (cell.classList.contains('flagged')) {
            cell.classList.remove('flagged');
            cell.textContent = '';
        } else {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
        }
    }

    // Обработчик касания для мобильных устройств
    function handleTouchStart(event) {
        event.preventDefault();
        const cell = event.target;
        if (event.touches.length === 2) { // Два касания — эквивалент правого клика
            handleRightClick(event);
        } else {
            handleCellClick(event);
        }
    }

    // Подсчёт мин вокруг ячейки
    function countNeighborBombs(row, col) {
        let bombCount = 0;
        const rows = 8;
        const cols = 8;

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                    const neighbor = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
                    if (neighbor && neighbor.dataset.isBomb) {
                        bombCount++;
                    }
                }
            }
        }
        return bombCount;
    }

    // Проверка на победу
    function checkWin() {
        const cells = document.querySelectorAll('.cell');
        let revealedNonBombs = 0;
        const totalNonBombs = 64 - 10; // 8x8 поле с 10 минами

        cells.forEach(cell => {
            if (cell.classList.contains('revealed') && !cell.dataset.isBomb) {
                revealedNonBombs++;
            }
        });

        if (revealedNonBombs === totalNonBombs) {
            alert('Поздравляем, вы выиграли! Нажмите "Start" для новой игры.');
            totalScore += 100; // Добавляем 100 очков за победу
            gameActive = false;
            updateScoreDisplay();
            saveScoreToFirebase();
        }
    }

    // Показать все мины при проигрыше
    function revealAllBombs() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            if (cell.dataset.isBomb) {
                cell.classList.add('revealed', 'bomb');
                cell.textContent = '💣';
            }
        });
    }

    // Сброс игры
    function resetGame() {
        gameContainer.style.display = 'none';
        startMenu.style.display = 'block';
        gameField.innerHTML = '';
        gameActive = false;
    }

    // Загружаем счёт при запуске
    loadScoreFromFirebase();
}).catch(error => {
    console.error('Ошибка при инициализации Telegram WebApp:', error);
});
