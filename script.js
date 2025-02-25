<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Сапёр (Windows XP Style)</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: "MS Sans Serif", Arial, sans-serif;
            background: linear-gradient(to bottom, #008080, #000080); /* Зелёно-синий градиент Windows XP */
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            overflow: hidden;
        }

        #taskbar {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 40px;
            background: #C0C0C0; /* Серебристый цвет панели задач Windows XP */
            border-top: 2px solid #808080;
            display: flex;
            align-items: center;
            padding: 0 10px;
            box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.5);
        }

        #start-button {
            background: #008080; /* Цвет кнопки Start Windows XP */
            border: 2px outset #C0C0C0;
            padding: 5px 10px;
            margin-right: 10px;
            cursor: pointer;
            font-weight: bold;
            color: white;
            font-size: 14px;
        }

        #start-button:hover {
            background: #006666;
            border: 2px inset #C0C0C0;
        }

        #start-menu {
            display: none;
            position: fixed;
            bottom: 40px;
            left: 10px;
            background: #C0C0C0;
            border: 2px solid #808080;
            padding: 5px;
            box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
            z-index: 1000;
            min-width: 200px;
        }

        .menu-item {
            padding: 5px 15px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
        }

        .menu-item:hover {
            background: #A0A0A0;
        }

        .menu-item img {
            width: 16px;
            height: 16px;
            margin-right: 10px;
        }

        #game-container, #leaderboard-container {
            display: none;
            width: 100%;
            max-width: 400px;
            padding: 20px;
            background: #C0C0C0;
            border: 2px solid #808080;
            box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
            margin-top: 20px;
        }

        #game-container.active, #leaderboard-container.active {
            display: block;
        }

        #gameField {
            display: grid;
            gap: 2px;
            margin: 20px auto;
            padding: 5px;
            background: #C0C0C0;
            border: 2px solid #808080;
            width: 320px;
            justify-content: center;
        }

        .cell {
            width: 32px;
            height: 32px;
            background: #C0C0C0;
            border: 2px outset #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            cursor: pointer;
            font-family: "MS Sans Serif", Arial, sans-serif;
        }

        .cell.revealed {
            background: #FFFFFF;
            border: 2px inset #808080;
        }

        .cell.bomb {
            background: #FF0000;
            color: white;
            border: 2px inset #808080;
        }

        button {
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            border: 2px outset #FFFFFF;
            background: #008080;
            color: white;
            font-family: "MS Sans Serif", Arial, sans-serif;
        }

        button:hover {
            background: #006666;
            border: 2px inset #FFFFFF;
        }

        #score, #leaderboard {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 10px 0;
            color: #000000;
            font-family: "MS Sans Serif", Arial, sans-serif;
        }

        #leaderboard-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, #008080, #000080);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        #leaderboard-header {
            display: flex;
            justify-content: space-between;
            width: 100%;
            max-width: 400px;
            padding: 10px;
            background: #C0C0C0;
            border: 2px solid #808080;
            margin-bottom: 20px;
        }

        #back-button {
            background: #008080;
            border: 2px outset #C0C0C0;
            padding: 5px 10px;
            cursor: pointer;
            font-weight: bold;
            color: white;
            font-size: 14px;
            font-family: "MS Sans Serif", Arial, sans-serif;
        }

        #back-button:hover {
            background: #006666;
            border: 2px inset #C0C0C0;
        }
    </style>
</head>
<body>
    <div id="taskbar">
        <button id="start-button">Start</button>
    </div>

    <div id="start-menu">
        <div class="menu-item" id="minesweeper-launch">Сапёр <span style="font-size: 12px;">💣</span></div>
    </div>

    <div id="game-container">
        <div id="score">Счёт: 0</div>
        <div id="gameField"></div>
        <div id="buttonContainer"></div>
        <div id="leaderboard"></div>
    </div>

    <div id="leaderboard-container">
        <div id="leaderboard-header">
            <button id="back-button">Назад</button>
            <div id="player-rank">Место: <span id="player-position"></span>, Очков: <span id="player-total-score"></span>, <span id="player-leaderboard-name"></span></div>
        </div>
        <div id="leaderboard-content"></div>
    </div>

    <!-- Подключаем Telegram WebApp API -->
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <!-- Подключаем Firebase через CDN -->
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

        // Делаем db и функции глобальными для script.js
        window.db = db;
        window.firebaseFunctions = { ref, get, update };

        console.log("Firebase инициализирован в HTML");

        // Загружаем основной скрипт после инициализации
        document.addEventListener('DOMContentLoaded', () => {
            const script = document.createElement('script');
            script.src = 'script.js';
            document.body.appendChild(script);
        });
    </script>
</body>
</html>
