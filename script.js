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
    const gameOverContainer = document.getElementById('game-over-container');
    const gameOverMessage = document.getElementById('game-over-message');
    const playAgainButton = document.getElementById('play-again');

    // Инициализация состояния
    let totalScore = 0;
    let gameActive = false;

    // Устанавливаем начальное состояние
    taskbar.style.display = 'flex';
    startMenu.style.display = 'none';
    gameContainer.style.display = 'none';
    ratingContainer.style.display = 'none';
    gameOverContainer.style.display = 'none';

    // Получаем данные игрока из Telegram
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    const playerName = user?.username || user?.first_name || 'Аноним';
    const userId = user?.id || 'default_user';
    const isPremium = user?.is_premium || false;
    console.log('Пользователь:', { userId, playerName, isPremium });

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
        console.log('Сохраняем в Firebase:', { userId, score: totalScore, name: playerName });
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
        return window.firebaseFunctions.get(scoresQuery).then((snapshot) => {
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

                // Определяем место пользователя в рейтинге
                const userPosition = scores.findIndex(p => p.name === playerName) + 1;
                return userPosition || scores.length + 1; // Если пользователя нет в топ-10, показываем последнее место
            }
            return Promise.resolve(1); // Возвращаем дефолтное место в случае отсутствия данных
        }).catch((error) => {
            console.error('Ошибка загрузки рейтинга из Firebase:', error);
            return Promise.resolve(1); // Возвращаем дефолтное место в случае ошибки
        });
    }

    // Показать модальное окно после проигрыша или победы
    function showGameOver(message, isWin) {
        gameOverMessage.textContent = message;
        gameOverContainer.style.display = 'block';
        gameActive = false;
        saveScoreToFirefox(); // Сохраняем счёт после поражения или победы
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

    // Обработчик для кнопки "Играть ещё"
    playAgainButton.addEventListener('click', () => {
        gameOverContainer.style.display = 'none';
        resetGame();
        gameContainer.style.display = 'block';
        gameActive = true;
        initializeGame();
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
                    cell.setAttribute('data-is-bomb', 'true'); // Устанавливаем атрибут через setAttribute для совместимости
                    console.log(`Бомба добавлена в ячейку [${i},${j}]`);
                } else {
                    console.log(`Пустая ячейка в [${i},${j}]`);
                }

                // Проверяем, поддерживает ли элемент addEventListener
                if (cell.addEventListener) {
                    cell.addEventListener('click', handleCellClick, false);
                    cell.addEventListener('contextmenu', handleRightClick, false); // Для установки флага правой кнопкой
                    cell.addEventListener('touchstart', handleTouchStart, { passive: false }); // Улучшенная обработка для сенсорных устройств
                    cell.addEventListener('touchend', handleTouchEnd, { passive: false }); // Дополнительная обработка для сенсорных устройств
                } else {
                    console.error(`Элемент не поддерживает addEventListener для ячейки [${i},${j}]`);
                }
                gameField.appendChild(cell);
            }
        }

        gameField.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
    }

    // Обработчик клика по ячейке (левая кнопка)
    function handleCellClick(event) {
        if (!event) {
            console.error('Событие не определено в handleCellClick');
            return;
        }
        event.preventDefault();
        console.log('Клик по ячейке:', event.type, event.target, 'Premium:', isPremium, 'isBomb:', event.target?.getAttribute('data-is-bomb'));
        const cell = event.target;
        if (!cell) {
            console.error('Цель события не определена');
            return;
        }
        if (cell.classList.contains('revealed') || cell.classList.contains('flagged')) return;

        cell.classList.add('revealed');

        const isBomb = cell.getAttribute('data-is-bomb') === 'true'; // Используем getAttribute для совместимости
        if (isBomb) {
            cell.classList.add('bomb');
            cell.textContent = '💣';
            loadAndDisplayRating().then(userPosition => {
                showGameOver(`Вы проиграли! Ваш счёт: ${totalScore} очков. Ваше место в рейтинге: ${userPosition || 'Не в топ-10'}.`, false);
            }).catch(error => {
                console.error('Ошибка при загрузке рейтинга для поражения:', error);
                showGameOver(`Вы проиграли! Ваш счёт: ${totalScore} очков. Ваше место в рейтинге: Неизвестно.`, false);
            });
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
        if (!event) {
            console.error('Событие не определено в handleRightClick');
            return;
        }
        event.preventDefault();
        console.log('Правый клик по ячейке:', event.target, 'Premium:', isPremium);
        const cell = event.target;
        if (!cell) {
            console.error('Цель события не определена');
            return;
        }
        if (cell.classList.contains('revealed')) return;

        if (cell.classList.contains('flagged')) {
            cell.classList.remove('flagged');
            cell.textContent = '';
        } else {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
        }
    }

    // Обработчик касания для начала (мобильные устройства)
    function handleTouchStart(event) {
        if (!event) {
            console.error('Событие не определено в handleTouchStart');
            return;
        }
        event.preventDefault();
        console.log('Touch start:', event.touches.length, event.target, 'Premium:', isPremium);
        const cell = event.target;
        if (!cell) {
            console.error('Цель события не определена');
            return;
        }
        if (event.touches.length === 1) {
            // Одиночное касание — эквивалент левого клика
            handleCellClick(event);
        } else if (event.touches.length >= 2) {
            // Двойное или более касание — эквивалент правого клика
            handleRightClick(event);
        }
    }

    // Обработчик окончания касания (для точности на мобильных устройствах)
    function handleTouchEnd(event) {
        if (!event) {
            console.error('Событие не определено в handleTouchEnd');
            return;
        }
        event.preventDefault();
        console.log('Touch end:', event.changedTouches.length, event.target, 'Premium:', isPremium);
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
                    if (neighbor && neighbor.getAttribute('data-is-bomb') === 'true') {
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
            if (cell.classList.contains('revealed') && cell.getAttribute('data-is-bomb') !== 'true') {
                revealedNonBombs++;
            }
        });

        if (revealedNonBombs === totalNonBombs) {
            loadAndDisplayRating().then(userPosition => {
                showGameOver(`Вы выиграли! Ваш счёт: ${totalScore} очков. Ваше место в рейтинге: ${userPosition || 'Не в топ-10'}.`, true);
            }).catch(error => {
                console.error('Ошибка при загрузке рейтинга для победы:', error);
                showGameOver(`Вы выиграли! Ваш счёт: ${totalScore} очков. Ваше место в рейтинге: Неизвестно.`, true);
            });
        }
    }

    // Показать все мины при проигрыше
    function revealAllBombs() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            if (cell.getAttribute('data-is-bomb') === 'true') {
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
