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
        private static updatePeriodMS = 1000 / 60;

        // TODO: Enum for pieces to ensure this covers the set
        private static colors = [
            "red",
            "cyan",
            "yellow",
            "lime",
            "green",
            "magenta",
            "orange",
        ];

        private board: React.RefObject<HTMLCanvasElement> = React.createRef<HTMLCanvasElement>();
        private next: React.RefObject<HTMLCanvasElement> = React.createRef<HTMLCanvasElement>();

        private boardContext: CanvasRenderingContext2D;
        private nextContext: CanvasRenderingContext2D;

        private replay?: fbg.Replay;
        private gameState?: fbg.GameState;
        private done: boolean = false;
        private updateHandle: number | null = null;

        constructor(props) {
            super(props);
            this.state = {
                level: 0,
                lines: 0,
                score: 0,
            };
        }

        private static drawPiece(context: CanvasRenderingContext2D, piece: number[][], pieceIndex: number, x0: number, y0: number): void {
            context.fillStyle = Replay.colors[pieceIndex];
            for (let i = 0; i < piece.length; i++) {
                const offsets = piece[i];
                const x = offsets[0];
                const y = offsets[1];
                context.fillRect(x0 + x, y0 + y, 1, 1);
            }
        }

        private visible(): boolean {
            return !!(this.board.current && this.next.current);
        }

        private draw = () => {
            if (this.visible()) {
                this.boardContext.fillStyle = "black";
                this.boardContext.fillRect(0, 0, fbg.boardWidth, fbg.boardHeight);
                this.nextContext.fillStyle = "black";
                this.nextContext.fillRect(0, 0, 4, 4);
    
                if (this.gameState) {
                    const board = this.gameState.board;
                    for (let i = 0; i < board.length; i++) {
                        const row = board[i];
                        for (let j = 0; j < row.length; j++) {
                            if (row[j] !== 0) {
                                this.boardContext.fillStyle = Replay.colors[row[j] - 1];
                                this.boardContext.fillRect(j, i, 1, 1);
                            }
                        }
                    }
                
                    const piece = this.gameState.piece;
                    if (piece) {
                        Replay.drawPiece(this.boardContext, piece, this.gameState.pieceIndex, this.gameState.pieceColumn, this.gameState.pieceRow)
                    }
                
                    // Next piece
                    const pieceNext = this.gameState.pieceNext;
                    if (pieceNext) {
                        Replay.drawPiece(this.nextContext, pieceNext, this.gameState.pieceNextIndex, 0, 3);
                    }
                }
            }
        }

        private update = () => {
            if (this.visible()) {
                if (!this.replay.advanceFrame()) {
                    if (!this.done) {
                        this.done = true;
                        clearInterval(this.updateHandle);
                    }
                }
            
                this.gameState = this.replay.getState();
                const { level, lines, score } = this.gameState;
                this.setState({
                    level,
                    lines,
                    score,
                });
                requestAnimationFrame(this.draw);
            }
        }

        // TODO: Unhook on dismount?
        async componentDidMount() {
            const response = await fetch(getScoreUrl(parseInt(parameters.get("mode")), this.props.seed));
            if (response.ok) {
                const replayComponent = this;
                const data = await response.json();

                if (this.visible()) {
                    // Initialize canvas
                    this.boardContext = this.board.current.getContext("2d");
                    this.nextContext = this.next.current.getContext("2d");

                    const scale = this.board.current.width / 10;
                    this.boardContext.translate(0, this.board.current.height);
                    this.boardContext.scale(scale, -scale);

                    this.nextContext.translate(0, this.next.current.height);
                    this.nextContext.scale(scale, -scale);
    
                    // Initialize replay
                    this.replay = new fbg.Replay(data.replay);
                    this.replay.start();
                    this.updateHandle = setInterval(this.update, Replay.updatePeriodMS);
                }
            }
        }

        render() {
            return <div>
                <div className="horizontal">
                    <canvas ref={this.board} width={200} height={400} tabIndex={1}></canvas>
                    <div className="vertical">
                        <p>Next</p>
                        <canvas ref={this.next} width={80} height={80}></canvas>
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
    interface TopScoreTableProps {
        title: string;
        mode: fbg.GameMode;
    }

    class TopScoreTable extends React.Component<TopScoreTableProps, {rows?: Contract.TopScore[]}> {
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

            return <table>
                <tr><th colSpan={2}>{this.props.title}</th></tr>
                {body}
            </table>;
        }
    }

    function Leaderboard() {
        return <div className="horizontal">
            <TopScoreTable title="Endless" mode={fbg.GameMode.endless}></TopScoreTable>
            <TopScoreTable title="Countdown" mode={fbg.GameMode.countdown}></TopScoreTable>
            <TopScoreTable title="Cleanup" mode={fbg.GameMode.cleanup}></TopScoreTable>
        </div>
    }

    ReactDOM.render(<Leaderboard/>, root);
}
