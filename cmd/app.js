const blessed = require("blessed");
const fbg = require("../lib/src/fbg-lib.js");

const screen = blessed.screen({ smartCSR: true });

screen.title = "Falling Block Game";

const board = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: 22,
    height: 22,
    border: { type: "line" },
    tags: true,
});

const ui = blessed.box({
    parent: screen,
    title: "UI",
    top: 0,
    left: 22,
    width: 22,
    height: 22,
    border: { type: "line" },
    tags: true,
})

function updateScore(level, lines, score) {
    ui.setLine(0, `Level:{|}${level}`);
    ui.setLine(1, `Lines:{|}${lines}`);
    ui.setLine(2, `Score:{|}${score}`);
}
updateScore();

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

let keys = {
    down: 0,
    left: 1,
    right: 2,
    ccw: 3,
    cw: 4,
}

let keyQueue = [];
screen.on("keypress", function (code, key) {
    switch (key.name) {
        case "down": keyQueue.push(keys.down); break;
        case "left": keyQueue.push(keys.left); break;
        case "right": keyQueue.push(keys.right); break;
        case "z": keyQueue.push(keys.ccw); break;
        case "x": keyQueue.push(keys.cw); break;
    }
});

// TODO: Random seeds
const game = new fbg.Game(fbg.Game.Mode.endless, 9, [ 1, 2, 3, 4 ]);
const keyDown = [];
function update() {
    for (let keyName in keys) {
        keyDown[keys[keyName]] = false;
    }

    keyQueue.forEach(function (key) {
        keyDown[key] = true;
    });

    keyQueue = [];

    game.gameAdvanceFrame(function () {
        return {
            upPressed: false,
            downPressed: keyDown[keys.down],
            leftPressed: keyDown[keys.left],
            rightPressed: keyDown[keys.right],
            cwPressed: keyDown[keys.cw],
            ccwPressed: keyDown[keys.ccw],
        };
    });
}

const mask = [];
for (let j = 0; j < 20; j++) {
    mask[j] = [];
}

function draw() {
    // TODO: Colors
    const state = game.getState();
    for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 10; j++) {
            mask[i][j] = state.board[i][j];
        }
    }

    if (state.piece) {
        for (let n = 0; n < state.piece.length; n++) {
            let offsets = state.piece[n];
            let i = state.pieceRow + offsets[1];
            let j = state.pieceColumn + offsets[0];
            if (i < 20) {
                mask[i][j] = state.pieceIndex + 1;
            }
        }
    }

    updateScore(state.level, state.lines, state.score);

    // TODO: Show next piece

    for (let i = 0; i < 20; i++) {
        let str = "";
        for (let j = 0; j < 10; j++) {
            let fill = (mask[19 - i][j] !== 0);
            str += fill ? "{white-bg}  {/}" : "  ";
        }
        board.setLine(i, str);
    }
    screen.render();
}

setInterval(function () {
    update();
    draw();
}, 1000 / 60);
