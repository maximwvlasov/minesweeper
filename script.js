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
    const gameContainer = document.getElementById('game-container');
    const gameField = document.getElementById('gameField');
    const scoreElement = document.getElementById('score');
    const taskbar = document.getElementById('taskbar');

    // Инициализация состояния
    let totalScore = 0;
    let gameActive = false;

    // Устанавливаем начальное состояние
    taskbar.style.display = 'flex';
    startMenu.style.display = 'none';
    gameContainer.style.display = 'none';

    // Получаем данные из Firebase
    function loadScoreFromFirebase() {
        const userId = window.Telegram.WebApp.initDataUnsafe?.user?.id || 'default_user';
        const scoreRef = window.firebaseFunctions.ref(window.db, `scores/${userId}`);
        window.firebaseFunctions.get(scoreRef).then((snapshot) => {
            if (snapshot.exists()) {
                totalScore = snapshot.val() || 0;
                updateScoreDisplay();
            }
        }).catch((error) => {
            console.error('Ошибка загрузки счёта из Firebase:', error);
        });
    }

    // Сохраняем данные в Firebase
    function saveScoreToFirebase() {
        const userId = window.Telegram.WebApp.initDataUnsafe?.user?.id || 'default_user';
        const scoreRef = window.firebaseFunctions.ref(window.db, `scores/${userId}`);
        window.firebaseFunctions.update(scoreRef, { score: totalScore }).catch((error) => {
            console.error('Ошибка сохранения счёта в Firebase:', error);
        });
    }

    // Обновляем отображение счёта
    function updateScoreDisplay() {
        scoreElement.textContent = `Счёт: ${totalScore}`;
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
}).catch(error => {
    console.error('Ошибка при инициализации Telegram WebApp:', error);
});
