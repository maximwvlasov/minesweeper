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
    const taskbar = document.getElementById('taskbar');
    const gameField = document.getElementById('gameField');
    const score = document.getElementById('score');
    const buttonContainer = document.getElementById('buttonContainer');

    // Убедимся, что taskbar и startButton видны, а остальные скрыты
    taskbar.style.display = 'flex';
    startMenu.style.display = 'none';
    gameContainer.style.display = 'none';

    // Обработчик для кнопки "Start"
    startButton.addEventListener('click', () => {
        startMenu.style.display = startMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Обработчик для кнопки "Сапёр" в меню
    minesweeperLaunch.addEventListener('click', () => {
        startMenu.style.display = 'none';
        gameContainer.style.display = 'block';

        // Инициализация игры
        initializeGame();
    });

    // Функция для инициализации игры
    function initializeGame() {
        // Очищаем предыдущее состояние поля
        gameField.innerHTML = '';
        score.textContent = 'Счёт: 0';

        // Создаём сетку 10x10 (можно настроить под ваши нужды)
        const rows = 10;
        const cols = 10;
        const totalCells = rows * cols;
        const bombCount = 10; // Количество мин, настройте по необходимости

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

                // Проверяем, является ли ячейка миной
                if (bombs.has(cellIndex)) {
                    cell.dataset.isBomb = true;
                }

                // Обработчик клика по ячейке
                cell.addEventListener('click', handleCellClick);
                gameField.appendChild(cell);
            }
        }

        // Стилизуем игровое поле как сетку
        gameField.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
    }

    // Обработчик клика по ячейке
    function handleCellClick(event) {
        const cell = event.target;
        if (cell.classList.contains('revealed')) return; // Игнорируем уже открытые ячейки

        cell.classList.add('revealed');

        // Проверяем, является ли ячейка миной
        if (cell.dataset.isBomb) {
            cell.classList.add('bomb');
            cell.textContent = '💣';
            alert('Вы проиграли! Нажмите "Start" для новой игры.');
            resetGame();
        } else {
            // Подсчитываем количество мин вокруг (простая логика, можно улучшить)
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            let bombCount = 0;

            // Проверяем соседние ячейки
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
                        const neighbor = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
                        if (neighbor && neighbor.dataset.isBomb) {
                            bombCount++;
                        }
                    }
                }
            }

            if (bombCount > 0) {
                cell.textContent = bombCount;
            }

            // Проверяем победу (все ячейки без мин открыты)
            checkWin();
        }
    }

    // Функция для проверки победы
    function checkWin() {
        const cells = document.querySelectorAll('.cell');
        let revealedNonBombs = 0;
        const totalNonBombs = 100 - 10; // 10x10 поле с 10 минами

        cells.forEach(cell => {
            if (cell.classList.contains('revealed') && !cell.dataset.isBomb) {
                revealedNonBombs++;
            }
        });

        if (revealedNonBombs === totalNonBombs) {
            alert('Поздравляем, вы выиграли! Нажмите "Start" для новой игры.');
            resetGame();
        }
    }

    // Функция для сброса игры
    function resetGame() {
        gameContainer.style.display = 'none';
        startMenu.style.display = 'block';
        gameField.innerHTML = '';
        score.textContent = 'Счёт: 0';
    }
});
