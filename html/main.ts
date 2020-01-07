import * as fbg from "../lib-ts/fbg-lib"
import "jquery";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const context = canvas.getContext("2d");

const spans = {
    level: document.getElementById("level"),
    lines: document.getElementById("lines"),
    score: document.getElementById("score"),
}

const scale = canvas.width / 10;
context.translate(0, canvas.height);
context.scale(scale, -scale);

const log = document.getElementById("log");
function trace(message: string): void {
    log.appendChild(document.createTextNode(`${message}\n`));
}

// const seeds = crypto.getRandomValues(new Uint32Array(4));
// const mode = fbg.GameMode.endless;
// const initialLevel = 9;
// const game = new fbg.Game(mode, initialLevel, [seeds[0], seeds[1], seeds[2], seeds[3]]);

// TODO: Enum for pieces to ensure this covers the set
const colors = [
    "red",
    "cyan",
    "yellow",
    "lime",
    "green",
    "magenta",
    "orange",
];

function render(state: fbg.GameState): void {
    context.fillStyle = "black";
    context.fillRect(0, 0, fbg.boardWidth, fbg.boardHeight);

    const board = state.board;
    for (let i = 0; i < board.length; i++) {
        const row = board[i];
        for (let j = 0; j < row.length; j++) {
            if (row[j] !== 0) {
                context.fillStyle = colors[row[j] - 1];
                context.fillRect(j, i, 1, 1);
            }
        }
    }

    const piece = state.piece;
    if (piece) {
        const x0 = state.pieceColumn;
        const y0 = state.pieceRow;
        context.fillStyle = colors[state.pieceIndex];
        for (let i = 0; i < piece.length; i++) {
            const offsets = piece[i];
            const x = offsets[0];
            const y = offsets[1];
            context.fillRect(x0 + x, y0 + y, 1, 1);
        }
    }

    for (let spanName in spans) {
        const span = spans[spanName];
        while (span.firstChild) {
            span.removeChild(span.firstChild);
        }

        span.appendChild(document.createTextNode(`${state[spanName]}`));
    }
}

let inputState: fbg.InputData = {
    upPressed: false,
    downPressed: false,
    leftPressed: false,
    rightPressed: false,
    cwPressed: false,
    ccwPressed: false,
};

const keyCodeToField = {
    37: "leftPressed",
    39: "rightPressed",
    40: "downPressed",
    90: "ccwPressed",
    88: "cwPressed",
};

for (let item of [ "keydown", "keyup" ]) {
    const pressed = (item === "keydown");
    canvas.addEventListener(item, function (keyDownEvent: KeyboardEvent) {
        const keyCode = keyDownEvent.keyCode;
        if (keyCode in keyCodeToField) {
            keyDownEvent.preventDefault();
            inputState[keyCodeToField[keyCode]] = pressed;
        }
    }, false);
}

function showReplay(replayString: string) {
    const replay = new fbg.Replay(replayString);
    replay.start();
    

    let done = false;
    let updateHandle: number | null = null;
    function renderReplay() {
        render(replay.getState());
    }

    function update(): void {
        if (!replay.advanceFrame()) {
            if (!done) {
                done = true;
                trace("Game over.");
                clearInterval(updateHandle);
            }
        }
    
        requestAnimationFrame(renderReplay);
    }
    
    
    const updatePeriodMS = 1000 / 60;
    updateHandle = setInterval(update, updatePeriodMS);
}

const apiEndpoint = "http://localhost:8888/.netlify/functions/api"; // Local test server
function getScoreUrl(mode: number, seed: string) {
    return `${apiEndpoint}/scores/${encodeURIComponent(mode)}/${encodeURIComponent(seed)}`;
}

const parameters = new URLSearchParams(window.location.search);
if (parameters.has("mode") && parameters.has("seed")) {
    const mode = parseInt(parameters.get("mode"));
    const seed = parameters.get("seed");
    $.ajax({
        method: "GET",
        url: getScoreUrl(mode, seed),
        dataType: "json",
    }).then((data) => {
        showReplay(data.replay);
    });
}
