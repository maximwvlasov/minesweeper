// Исправленный script.js для Telegram Mini App

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
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const taskbar = document.getElementById('taskbar');
    const backButton = document.getElementById('back-button');

    // Убедимся, что taskbar и startButton видны, а остальные скрыты
    taskbar.style.display = 'flex';
    startMenu.style.display = 'none';
    gameContainer.style.display = 'none';
    leaderboardContainer.style.display = 'none';
    backButton.style.display = 'none';

    // Обработчик для кнопки "Start"
    startButton.addEventListener('click', () => {
        startMenu.style.display = startMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Обработчик для кнопки "Сапёр" в меню
    minesweeperLaunch.addEventListener('click', () => {
        startMenu.style.display = 'none';
        gameContainer.style.display = 'block';
        leaderboardContainer.style.display = 'none';
        backButton.style.display = 'block';
    });

    // Обработчик для кнопки "Назад"
    backButton.addEventListener('click', () => {
        gameContainer.style.display = 'none';
        leaderboardContainer.style.display = 'none';
        startMenu.style.display = 'none';
        backButton.style.display = 'none';
    });

    console.log("Исправленный скрипт загружен.");
});

    console.log("Исправленный скрипт загружен.");
});

