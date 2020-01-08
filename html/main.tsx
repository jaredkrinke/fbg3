import * as fbg from "../lib-ts/fbg-lib"
import * as Contract from "fbg-db-contract";
declare const React: typeof import("react");
declare const ReactDOM: typeof import("react-dom");

// Note: This commented-out code is for actually playing FBG in the browser

// const seeds = crypto.getRandomValues(new Uint32Array(4));
// const mode = fbg.GameMode.endless;
// const initialLevel = 9;
// const game = new fbg.Game(mode, initialLevel, [seeds[0], seeds[1], seeds[2], seeds[3]]);

// let inputState: fbg.InputData = {
//     upPressed: false,
//     downPressed: false,
//     leftPressed: false,
//     rightPressed: false,
//     cwPressed: false,
//     ccwPressed: false,
// };

// const keyCodeToField = {
//     37: "leftPressed",
//     39: "rightPressed",
//     40: "downPressed",
//     90: "ccwPressed",
//     88: "cwPressed",
// };

// for (let item of [ "keydown", "keyup" ]) {
//     const pressed = (item === "keydown");
//     canvas.addEventListener(item, function (keyDownEvent: KeyboardEvent) {
//         const keyCode = keyDownEvent.keyCode;
//         if (keyCode in keyCodeToField) {
//             keyDownEvent.preventDefault();
//             inputState[keyCodeToField[keyCode]] = pressed;
//         }
//     }, false);
// }

const apiEndpoint = "/.netlify/functions/api";
function getModeUrl(mode: number) {
    return `${apiEndpoint}/scores/${encodeURIComponent(mode)}`;
}

function getScoresWithSeedsUrl(mode: number) {
    return `${getModeUrl(mode)}?includeSeeds=true`;
}

function getScoreUrl(mode: number, seed: string) {
    return `${getModeUrl(mode)}/${encodeURIComponent(seed)}`;
}

const parameters = new URLSearchParams(window.location.search);
const root = document.getElementById("root");
if (parameters.has("mode") && parameters.has("seed")) {
    interface ReplayState {
        replayString?: string;

        level: number;
        lines: number;
        score: number;
    }

    class Replay extends React.Component<{ seed: string }, ReplayState> {
        constructor(props) {
            super(props);
            this.state = {
                level: 0,
                lines: 0,
                score: 0,
            }
        }

        async componentDidMount() {
            // TODO: This is huge and ugly; refactor, simplify, support unhooking on unmount, etc.

            const response = await fetch(getScoreUrl(parseInt(parameters.get("mode")), this.props.seed));
            if (response.ok) {
                const replayComponent = this;
                const data = await response.json();

                // Initialize canvas
                const canvas = document.getElementById("canvas") as HTMLCanvasElement;
                const context = canvas.getContext("2d");

                const canvasNext = document.getElementById("canvasNext") as HTMLCanvasElement;
                const contextNext = canvasNext.getContext("2d");

                const scale = canvas.width / 10;
                context.translate(0, canvas.height);
                context.scale(scale, -scale);

                contextNext.translate(0, canvasNext.height);
                contextNext.scale(scale, -scale);

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

                function drawPiece(context: CanvasRenderingContext2D, piece: number[][], pieceIndex: number, x0: number, y0: number) {
                    context.fillStyle = colors[pieceIndex];
                    for (let i = 0; i < piece.length; i++) {
                        const offsets = piece[i];
                        const x = offsets[0];
                        const y = offsets[1];
                        context.fillRect(x0 + x, y0 + y, 1, 1);
                    }
                }
                
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
                        drawPiece(context, piece, state.pieceIndex, state.pieceColumn, state.pieceRow)
                    }
                
                    // Next piece
                    contextNext.fillStyle = "black";
                    contextNext.fillRect(0, 0, 4, 4);
                    
                    const pieceNext = state.pieceNext;
                    if (pieceNext) {
                        drawPiece(contextNext, pieceNext, state.pieceNextIndex, 0, 3);
                    }
                }

                const replay = new fbg.Replay(data.replay);
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
                            clearInterval(updateHandle);
                        }
                    }
                
                    const { level, lines, score } = replay.getState();
                    replayComponent.setState({
                        level,
                        lines,
                        score,
                    });
                    requestAnimationFrame(renderReplay);
                }
                
                
                const updatePeriodMS = 1000 / 60;
                updateHandle = setInterval(update, updatePeriodMS);
            }
        }

        render() {
            return <div>
                <div className="horizontal">
                    <canvas id="canvas" width={200} height={400} tabIndex={1}></canvas>
                    <div className="vertical">
                        <p>Next</p>
                        <canvas id="canvasNext" width={80} height={80}></canvas>
                    </div>
                </div>
                <p>Level: {this.state.level}</p>
                <p>Lines: {this.state.lines}</p>
                <p>Score: {this.state.score}</p>
            </div>
            ;
        }
    }

    ReactDOM.render(<Replay seed={parameters.get("seed")}/>, root);
} else {
    // Leaderboard
    const gameModeToName: {[key in fbg.GameMode]: string} = {
        [fbg.GameMode.endless]: "Endless",
        [fbg.GameMode.countdown]: "Countdown",
        [fbg.GameMode.cleanup]: "Cleanup",
    };

    class TopScoreTable extends React.Component<{mode: fbg.GameMode}, {rows?: Contract.TopScore[]}> {
        constructor(props) {
            super(props);
            this.state = {};
        }

        async componentDidMount() {
            const response = await fetch(getScoresWithSeedsUrl(this.props.mode));
            if (response.ok) {
                this.setState({ rows: await response.json() });
            }
        }

        render() {
            let body;
            if (this.state.rows) {
                body = this.state.rows.map((row) =>
                    <tr>
                        <td>{row.initials}</td>
                        <td><a href={`?mode=${this.props.mode}&seed=${row.seed}`}>{row.score}</a></td>
                    </tr>);
            } else {
                body = <tr><td colSpan={2}>Loading...</td></tr>;
            }

            return <table id="table1">
                <tr><th colSpan={2}>{gameModeToName[this.props.mode]}</th></tr>
                {body}
            </table>;
        }
    }

    function Leaderboard() {
        return <div className="horizontal" id="table">
            <TopScoreTable mode={fbg.GameMode.endless}></TopScoreTable>
            <TopScoreTable mode={fbg.GameMode.countdown}></TopScoreTable>
            <TopScoreTable mode={fbg.GameMode.cleanup}></TopScoreTable>
        </div>
    }

    ReactDOM.render(<Leaderboard/>, root);
}
