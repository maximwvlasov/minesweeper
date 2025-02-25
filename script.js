{\rtf1\ansi\ansicpg1251\cocoartf2759
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const FIELD_SIZE = 8;\
const MINES_COUNT = 10;\
let field = [];\
let revealed = [];\
let gameOver = false;\
\
const gameField = document.getElementById('game-field');\
const restartButton = document.getElementById('restart');\
const statusDiv = document.getElementById('status');\
\
window.Telegram.WebApp.ready();\
window.Telegram.WebApp.expand();\
\
function createField() \{\
    field = Array(FIELD_SIZE).fill().map(() => Array(FIELD_SIZE).fill(0));\
    revealed = Array(FIELD_SIZE).fill().map(() => Array(FIELD_SIZE).fill(false));\
    \
    let mines = 0;\
    while (mines < MINES_COUNT) \{\
        const x = Math.floor(Math.random() * FIELD_SIZE);\
        const y = Math.floor(Math.random() * FIELD_SIZE);\
        if (field[x][y] !== '\uc0\u55357 \u56483 ') \{\
            field[x][y] = '\uc0\u55357 \u56483 ';\
            mines++;\
            for (let dx = -1; dx <= 1; dx++) \{\
                for (let dy = -1; dy <= 1; dy++) \{\
                    const newX = x + dx;\
                    const newY = y + dy;\
                    if (newX >= 0 && newX < FIELD_SIZE && newY >= 0 && newY < FIELD_SIZE && field[newX][newY] !== '\uc0\u55357 \u56483 ') \{\
                        field[newX][newY]++;\
                    \}\
                \}\
            \}\
        \}\
    \}\
\}\
\
function renderField() \{\
    gameField.innerHTML = '';\
    gameField.style.gridTemplateColumns = `repeat($\{FIELD_SIZE\}, 40px)`;\
    for (let i = 0; i < FIELD_SIZE; i++) \{\
        for (let j = 0; j < FIELD_SIZE; j++) \{\
            const cell = document.createElement('div');\
            cell.className = 'cell';\
            if (revealed[i][j]) \{\
                cell.classList.add('revealed');\
                cell.textContent = field[i][j] === 0 ? '' : field[i][j];\
            \}\
            cell.addEventListener('click', () => openCell(i, j));\
            gameField.appendChild(cell);\
        \}\
    \}\
\}\
\
function openCell(x, y) \{\
    if (gameOver || revealed[x][y]) return;\
    \
    revealed[x][y] = true;\
    if (field[x][y] === '\uc0\u55357 \u56483 ') \{\
        gameOver = true;\
        statusDiv.textContent = '\uc0\u1042 \u1099  \u1087 \u1088 \u1086 \u1080 \u1075 \u1088 \u1072 \u1083 \u1080 !';\
        revealAll();\
    \} else \{\
        renderField();\
        checkWin();\
    \}\
\}\
\
function checkWin() \{\
    let closedCells = 0;\
    for (let i = 0; i < FIELD_SIZE; i++) \{\
        for (let j = 0; j < FIELD_SIZE; j++) \{\
            if (!revealed[i][j] && field[i][j] !== '\uc0\u55357 \u56483 ') closedCells++;\
        \}\
    \}\
    if (closedCells === 0) \{\
        gameOver = true;\
        statusDiv.textContent = '\uc0\u1042 \u1099  \u1074 \u1099 \u1080 \u1075 \u1088 \u1072 \u1083 \u1080 !';\
    \}\
\}\
\
function revealAll() \{\
    revealed = revealed.map(row => row.map(() => true));\
    renderField();\
\}\
\
function startGame() \{\
    gameOver = false;\
    statusDiv.textContent = '';\
    createField();\
    renderField();\
\}\
\
restartButton.addEventListener('click', startGame);\
\
startGame();}