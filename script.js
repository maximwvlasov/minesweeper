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

        // Инициализация игры (если нужно, добавьте логику создания игрового поля здесь)
        initializeGame(); // Эта функция должна быть определена для создания игрового поля
    });

    console.log("Исправленный скрипт загружен.");
});

// Функция для инициализации игры (добавьте эту логику, если её ещё нет)
function initializeGame() {
    const gameField = document.getElementById('gameField');
    const score = document.getElementById('score');
    const buttonContainer = document.getElementById('buttonContainer');

    // Пример: создаём простое игровое поле (можно адаптировать под ваш Minesweeper)
    gameField.innerHTML = ''; // Очищаем поле
    score.textContent = 'Счёт: 0';

    // Создаём сетку 10x10 (пример, настройте под ваши нужды)
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);
            gameField.appendChild(cell);
        }
    }

    // Пример обработки клика по ячейке
    function handleCellClick(event) {
        const cell = event.target;
        cell.classList.add('revealed');
        // Здесь добавьте логику проверки на мины и обновление счёта
    }
}

    console.log("Исправленный скрипт загружен.");
});

