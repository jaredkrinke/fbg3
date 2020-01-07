import Xorwow from "xorwow-js";
import * as LZString from "lz-string";

export const boardWidth = 10;
export const boardHeight = 20;

export enum GameMode {
    endless = 1,
    countdown = 2,
    cleanup = 3,
}

enum GameType {
    finite,
    infinite,
}

let modeToType: GameType[] = [];
modeToType[GameMode.endless] = GameType.infinite;
modeToType[GameMode.countdown] = GameType.finite;
modeToType[GameMode.cleanup] = GameType.finite;

interface BoardRow extends Array<number> {
    deleted: boolean;
}

export interface GameState {
    board: number[][];
    piece: number[][];

    pieceRow: number;
    pieceColumn: number;
    pieceIndex: number;

    pieceNext: number[][];
    pieceNextIndex: number;

    level: number;
    lines: number;
    score: number;
}

export class Game {
    public get score() {
        return this._score;
    }

    private static readonly modeToType = modeToType;
    private static readonly clearedToScore = [ 0, 40, 100, 300, 1200 ];
    private static readonly fastMoveInitialDelay = 10;
    private static readonly fastMovePeriod = 6;
    private static readonly firstDropPeriod = 60;
    private static readonly fastDropPeriod = 2;
    private static readonly nextPieceDelay = 10;
    private static readonly clearDelay = 20;
    private static readonly dropPeriods = [ 48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1 ];
    // TODO: I suspect these are needed for rendering/centering the next piece, but they're currently not used
    // private static readonly pieceWidths = [ 3, 3, 3, 3, 2, 4, 3 ];
    // private static readonly pieceOffsets = [ 1, 1, 1, 1, 1, 0, 1 ];
    // private static readonly pieceHeights = [ 2, 2, 2, 2, 2, 1, 2 ];
    private static readonly pieces = [
        [
            [ [ 1, 0 ], [ 2, 0 ], [ 2, -1 ], [ 3, -1 ] ],
            [ [ 3, 1 ], [ 2, 0 ], [ 3, 0 ],  [ 2, -1 ] ],
        ],
        [
            [ [ 2, 0 ], [ 3, 0 ], [ 1, -1 ], [ 2, -1 ] ],
            [ [ 2, 1 ], [ 2, 0 ], [ 3, 0 ],  [ 3, -1 ] ],
        ],
        [
            [ [ 1, 0 ], [ 2, 0 ], [ 3, 0 ],  [ 3, -1 ] ],
            [ [ 2, 1 ], [ 2, 0 ], [ 1, -1 ], [ 2, -1 ] ],
            [ [ 1, 1 ], [ 1, 0 ], [ 2, 0 ],  [ 3,  0 ] ],
            [ [ 2, 1 ], [ 3, 1 ], [ 2, 0 ],  [ 2, -1 ] ],
        ],
        [
            [ [ 1, 0 ], [ 2, 0 ], [ 3, 0 ],  [ 1, -1 ] ],
            [ [ 1, 1 ], [ 2, 1 ], [ 2, 0 ],  [ 2, -1 ] ],
            [ [ 3, 1 ], [ 1, 0 ], [ 2, 0 ],  [ 3,  0 ] ],
            [ [ 2, 1 ], [ 2, 0 ], [ 2, -1 ], [ 3, -1 ] ],
        ],
        [
            [ [ 1, 0 ], [ 2, 0 ], [ 1, -1 ],  [ 2, -1 ] ],
        ],
        [
            [ [ 0, 0 ], [ 1, 0 ], [ 2, 0 ],  [ 3,  0 ] ],
            [ [ 2, 2 ], [ 2, 1 ], [ 2, 0 ],  [ 2, -1 ] ],
        ],
        [
            [ [ 1, 0 ], [ 2, 0 ], [ 3, 0 ], [ 2, -1 ] ],
            [ [ 2, 1 ], [ 1, 0 ], [ 2, 0 ], [ 2, -1 ] ],
            [ [ 2, 1 ], [ 1, 0 ], [ 2, 0 ], [ 3,  0 ] ],
            [ [ 2, 1 ], [ 2, 0 ], [ 3, 0 ], [ 2, -1 ] ],
        ],
    ];

    private type: GameType;
    private prng: Xorwow;
    private board: BoardRow[];

    private level: number;
    private lines: number;
    private _score: number;

    private pieceIndex: number;
    private pieceNextIndex: number;
    private pieceColumn: number;
    private pieceRow: number;
    private pieceRotationIndex: number;

    private firstDrop: boolean;
    private fastDrop: boolean;
    private fastDropRow: number;
    private fastMove: boolean;

    private lastLeftPressed: boolean;
    private lastRightPressed: boolean;
    private lastDownPressed: boolean;
    private lastCWPressed: boolean;
    private lastCCWPressed: boolean;

    private timerNextPiece: number;
    private timerFastMove: number;
    private timerDrop: number;
    private frame: number;

    private eligibleForHighScore: boolean | null;
    private result: boolean | null;

    public constructor(private mode: GameMode, private initialLevel: number, seeds: number[]) {
        this.type = Game.modeToType[mode];
        this.prng = new Xorwow(seeds[0], seeds[1], seeds[2], seeds[3]);

        this.board = [];
        for (let row = 0; row < boardHeight; row++) {
            this.board[row] = [] as BoardRow;
            this.board[row].deleted = false;
        }
    
        this.gameReset();
    }

    public gameAdvanceFrame(readInput: () => InputData) {
        if (this.result === null) {
            this.frame++;
    
            if (this.pieceIndex === -1 && this.timerNextPiece > 0) {
                // Note: I don't see any negative impact, but note that input is NOT read here
                // TODO: Consider changing (and versioning) the protocol
                this.timerNextPiece--;
            } else {
                if (this.pieceIndex === -1) {
                    this.boardExpungeRows();
                    this.pieceAdvance();
                    if (this.pieceIndex >= 0 && !this.pieceValidate(this.pieceColumn, this.pieceRow, this.pieceRotationIndex)) {
                        this.gameEnd(this.type === GameType.infinite, false);
                    }
                }
    
                if (this.result === null) {
                    const { upPressed, downPressed, leftPressed, rightPressed, cwPressed, ccwPressed } = readInput();
    
                    if (leftPressed && !this.lastLeftPressed) {
                        this.pieceTryMoveLeft();
                        this.timerFastMove = -Game.fastMoveInitialDelay;
                    }
        
                    if (rightPressed && !this.lastRightPressed) {
                        this.pieceTryMoveRight();
                        this.timerFastMove = -Game.fastMoveInitialDelay;
                    }
        
                    if (leftPressed || rightPressed) {
                        this.timerFastMove++;
                        while (this.timerFastMove >= Game.fastMovePeriod) {
                            this.timerFastMove -= Game.fastMovePeriod;
                            if (leftPressed) {
                                this.pieceTryMoveLeft();
                            }
                            if (rightPressed) {
                                this.pieceTryMoveRight();
                            }
                        }
                    }
        
                    if (downPressed && !this.lastDownPressed) {
                        this.fastDrop = true;
                        this.fastDropRow = this.pieceRow;
        
                        this.timerDrop = Math.min(Math.min(this.timerDrop, Game.fastDropPeriod), this.gameGetDropPeriod());
                    } else if (!downPressed && this.lastDownPressed) {
                        this.fastDrop = false;
                    }
        
                    if (cwPressed && !this.lastCWPressed) {
                        this.pieceRotateCW();
                    }
        
                    if (ccwPressed && !this.lastCCWPressed) {
                        this.pieceRotateCCW();
                    }
        
                    // Drop
                    let dropPeriod = this.gameGetDropPeriod();
                    if (this.firstDrop) {
                        dropPeriod = Game.firstDropPeriod;
                    }
                    if (this.fastDrop) {
                        dropPeriod = Math.min(Game.fastDropPeriod, dropPeriod);
                    }
        
                    this.timerDrop++;
                    while (this.timerDrop >= dropPeriod) {
                        this.pieceMoveDown(leftPressed, rightPressed);
                        this.timerDrop -= dropPeriod;
                        this.firstDrop = false;
                    }
        
                    this.lastLeftPressed = leftPressed;
                    this.lastRightPressed = rightPressed;
                    this.lastDownPressed = downPressed;
                    this.lastCWPressed = cwPressed;
                    this.lastCCWPressed = ccwPressed;
                }
            }
        }
    }

    public getState(): GameState {
        // TODO: Use events instead
        return {
            board: this.board,
            piece: (this.pieceIndex >= 0) ? Game.pieces[this.pieceIndex][this.pieceRotationIndex] : null,

            pieceRow: this.pieceRow,
            pieceColumn: this.pieceColumn,
            pieceIndex: this.pieceIndex,

            pieceNext: (this.pieceNextIndex >= 0) ? Game.pieces[this.pieceNextIndex][0] : null,
            pieceNextIndex: this.pieceNextIndex,

            level: this.level,
            lines: this.lines,
            score: this.score,
        };
    }

    public isDone(): boolean {
        return this.result !== null;
    }

    private randomByte(maxExclusive: number): number {
        // Throw out values that wrap around to avoid bias
        while (true) {
            const number = this.prng.nextUInt32();
            let byte = 0;
            for (let i = 0; i < 4; i++) {
                byte ^= (0xff & (number >> (i * 8)));
            }

            if (byte + (256 % maxExclusive) < 256) {
                return byte % maxExclusive;
            }
        }
    }

    private boardClear(): void {
        for (let row = 0; row < boardHeight; row++) {
            for (let column = 0; column < boardWidth; column++) {
                this.board[row][column] = 0;
            }
        }
    }

    private boardAddGarbage(): void {
        for (let row = 0 ;row < 12; row++) {
            let valid = false;
            do {
                for (let column = 0; column < boardWidth; column++) {
                    if (this.randomByte(100) < 45) {
                        this.board[row][column] = this.randomByte(Game.pieces.length) + 1;
                    } else {
                        this.board[row][column] = 0;
                        valid = true;
                    }
                }
            } while (!valid);
        }
    }

    private boardOccupied(row: number, column: number): boolean {
        return this.board[row][column] !== 0;
    }

    private boardRemoveRow(row: number): void {
        this.board[row].deleted = true;
    }

    private boardExpungeRows(): void {
        let destination = -1;
        for (let row = 0; row < boardHeight; row++) {
            let deleted = this.board[row].deleted;
            if (deleted) {
                this.board[row].deleted = false;
            } else {
                destination++;
            }
    
            if (!deleted) {
                for (let column = 0; column < boardWidth; column++) {
                    this.board[destination][column] = this.board[row][column];
                }
            }
        }
    
        for (let row = destination + 1; row < boardHeight; row++) {
            for (let column = 0; column < boardWidth; column++) {
                this.board[row][column] = 0;
            }
        }
    }

    private boardClean(): number {
        let cleared = 0;
        for (let row = 0; row < boardHeight; row++) {
            let completed = true;
            for (let column = 0; column < boardWidth; column++) {
                if (!this.boardOccupied(row, column)) {
                    completed = false;
                    break;
                }
            }
    
            if (completed) {
                this.boardRemoveRow(row);
                cleared++;
            }
        }
    
        return cleared;
    }

    private pieceHide(): void {
        this.pieceIndex = -1;
    }

    private pieceChooseNext(): void {
        this.pieceNextIndex = this.randomByte(Game.pieces.length);
    }

    private pieceAdvance(): void {
        this.pieceHide();
        if (this.pieceNextIndex === -1) {
            this.pieceChooseNext();
        }
    
        this.pieceIndex = this.pieceNextIndex;
        this.pieceRotationIndex = 0;
        this.pieceChooseNext();
        this.pieceRow = 19;
        this.pieceColumn = 3;
    }

    private pieceForEachBlock(callback: (row: number, column: number) => boolean, columnBase: number, rowBase: number, rotationIndex: number): void {
        let pieceBlocks = Game.pieces[this.pieceIndex][rotationIndex];
        for (let n = 0; n < pieceBlocks.length; n++) {
            let offsets = pieceBlocks[n];
            let column = columnBase + offsets[0];
            let row = rowBase + offsets[1];
            if (!callback(row, column)) {
                break;
            }
        }
    }

    private pieceValidate(row: number, column: number, rotationIndex: number): boolean {
        let valid = true;
        this.pieceForEachBlock((row, column) => {
            if (column >= 0 && column < boardWidth && row >= 0) {
                if (row < boardHeight && this.boardOccupied(row, column)) {
                    valid = false;
                }
            } else {
                valid =  false;
            }
    
            return valid;
        }, row, column, rotationIndex);
    
        return valid;
    }

    private pieceTestMove(columnDelta: number, rowDelta: number): boolean {
        return this.pieceValidate(this.pieceColumn + columnDelta, this.pieceRow + rowDelta, this.pieceRotationIndex);
    }

    private pieceTryMove(columnDelta: number, rowDelta: number): boolean {
        if (this.pieceTestMove(columnDelta, rowDelta)) {
            this.pieceColumn += columnDelta;
            this.pieceRow += rowDelta;
            return true;
        }
        return false;
    }

    private pieceTryMoveDown(): boolean { return this.pieceTryMove(0, -1); }
    private pieceTryMoveLeft(): boolean { return this.pieceTryMove(-1, 0); }
    private pieceTryMoveRight(): boolean { return this.pieceTryMove(1, 0); }

    private pieceTryRotate(offset: number): boolean {
        const length = Game.pieces[this.pieceIndex].length;
        let rotationIndex = (this.pieceRotationIndex + offset + length) % length;
        if (this.pieceValidate(this.pieceColumn, this.pieceRow, rotationIndex)) {
            this.pieceRotationIndex = rotationIndex;
            return true;
        }
        return false;
    }

    private pieceRotateCW(): boolean { return this.pieceTryRotate(1); }
    private pieceRotateCCW(): boolean { return this.pieceTryRotate(-1); }

    private pieceComplete(): void {
        this.pieceForEachBlock((row, column) => {
            if (column >= 0 && column < boardWidth && row >= 0 && row < boardHeight) {
                this.board[row][column] = this.pieceIndex + 1;
            }
            return true;
        }, this.pieceColumn, this.pieceRow, this.pieceRotationIndex)
    }

    private pieceMoveDown(leftPressed: boolean, rightPressed: boolean): void {
        if (this.pieceIndex >= 0) {
            if (this.pieceTryMoveDown()) {
                // Check for slide underneath
                if (leftPressed && !this.pieceTestMove(-1, 1) && this.pieceTestMove(-1, 0)) {
                    this.pieceTryMoveLeft();
                } else if (rightPressed && !this.pieceTestMove(1, 1) && this.pieceTestMove(1, 0)) {
                    this.pieceTryMoveRight();
                }
            } else {
                this.pieceComplete();
    
                const previousLevel = this.level;
                const cleared = this.boardClean();
                this.gameScoreUpdate(cleared);
    
                this.fastDrop = false;
                this.pieceHide();
                this.timerNextPiece = Game.nextPieceDelay;
    
                if (cleared > 0) {
                    this.timerNextPiece += Game.clearDelay;
                    // TODO: Communicate back result (for e.g. sound effect)
                }
            }
        }
    }

    private gameGetDropPeriod(): number {
        const dropPeriods = Game.dropPeriods;
        return (this.level < dropPeriods.length) ? dropPeriods[this.level] : dropPeriods[dropPeriods.length - 1];
    }

    private gameReset(): void {
        this.boardClear();
        if (this.mode === GameMode.cleanup) {
            this.boardAddGarbage();
        }
    
        this.pieceIndex = -1;
        this.pieceNextIndex = -1;
    
        this.pieceAdvance();
        this._score = 0;
    
        if (this.type === GameType.infinite) {
            this.lines = 0;
        } else {
            this.lines = 25;
        }
    
        this.level = this.initialLevel;
        this.eligibleForHighScore = null;
        this.result = null; // TODO: Better name? E.g. "won"?
        this.firstDrop = true;
        this.fastDrop = false;
        this.fastDropRow = 0;
        this.fastMove = false;

        this.lastLeftPressed = false;
        this.lastRightPressed = false;
        this.lastDownPressed = false;
        this.lastCWPressed = false;
        this.lastCCWPressed = false;
    
        this.timerNextPiece = 0;
        this.timerFastMove = 0;
        this.timerDrop = 0;
    
        this.frame = 0;
    }

    private gameEnd(eligibleForHighScore: boolean, successful: boolean): void {
        this.eligibleForHighScore = eligibleForHighScore;
        this.result = successful;
    }

    private gameScoreUpdate(cleared: number): void {
        let points = 0;
        if (cleared >= 1) {
            points += Game.clearedToScore[cleared];
            points *= (this.level + 1);
    
            if (this.type === GameType.infinite) {
                this.lines += cleared;
                this.level = Math.max(this.level, Math.floor(this.lines / 10));
            } else {
                this.lines = Math.max(0, this.lines - cleared);
            }
        }
    
        if (this.fastDrop) {
            points += (this.fastDropRow - this.pieceRow);
        }
    
        // Max score is 999999
        this._score = Math.min(999999, this.score + points);
    
        if (this.type === GameType.finite && this.lines === 0) {
            this.gameEnd(true, true);
        }
    }
}

export interface InputData {
    upPressed: boolean;
    downPressed: boolean;
    leftPressed: boolean;
    rightPressed: boolean;
    cwPressed: boolean;
    ccwPressed: boolean;
}

export class Replay {
    private buffer: string;
    private index: number;
    private seeds: number[];

    private game: Game;
    private mode: GameMode;
    private initialLevel: number;
    private started: boolean;

    public constructor(str: string) {
        this.buffer = LZString.decompressFromBase64(str);
        this.index = 0;
        this.seeds = [];
    
        // Read four 4-byte seed values
        for (let i = 0; i < 4; i++) {
            let seed = 0;
            for (let j = 0; j < 4; j++) {
                seed |= this.nextByte() << (j * 8);
            }
            this.seeds.push(seed);
        }
    
        this.mode = this.nextByte();
        this.initialLevel = this.nextByte();
    
        this.started = false;
    }

    public start(): void {
        if (!this.started) {
            this.started = true;
            this.game = new Game(this.mode, this.initialLevel, this.seeds);
        }
    }

    public nextByte(): number {
        if (this.index >= this.buffer.length) {
            throw new Error(`Tried to read index ${this.index} which is past the end of ${this.buffer.length - 1}!`);
        }
        return this.buffer.charCodeAt(this.index++);
    }

    public advanceFrame(): boolean {
        this.start();

        const self = this;
        this.game.gameAdvanceFrame(function () { return self.nextByteAsInput(); });
    
        return !this.game.isDone();
    }

    public getState(): GameState {
        return this.game.getState();
    }

    public seekToEnd(): number {
        this.start();
        while (!this.advanceFrame()) {}
    
        return this.game.score;
    }

    private nextByteAsInput(): InputData {
        const input = this.nextByte();

        return {
            upPressed: ((input & 0x1) !== 0),
            downPressed: ((input & 0x2) !== 0),
            leftPressed: ((input & 0x4) !== 0),
            rightPressed: ((input & 0x8) !== 0),
            ccwPressed: ((input & 0x10) !== 0),
            cwPressed: ((input & 0x20) !== 0),
        };
    }
}
