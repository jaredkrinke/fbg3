const LZString = require("lz-string");
const xorwow = require("xorwow-js");

const Constants = {
    boardWidth: 10,
    boardHeight: 20,
    clearedToScore: [ 0, 40, 100, 300, 1200 ],
    fastMoveInitialDelay: 10,
    fastMovePeriod: 6,
    firstDropPeriod: 60,
    fastDropPeriod: 2,
    nextPieceDelay: 10,
    clearDelay: 20,
    dropPeriods: [ 48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1 ],
    pieceWidths: [ 3, 3, 3, 3, 2, 4, 3 ],
    pieceOffsets: [ 1, 1, 1, 1, 1, 0, 1 ],
    pieceHeights: [ 2, 2, 2, 2, 2, 1, 2 ],
    pieces: [
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
    ],
}

function Game(mode, initialLevel, seeds) {
    this.mode = mode;
    this.type = Game.modeToType[mode];
    this.initialLevel = initialLevel;
    this.prng = new xorwow.Xorwow(seeds[0], seeds[1], seeds[2], seeds[3]);

    this.width = Constants.boardWidth;
    this.height = Constants.boardHeight;
    this.board = [];
    for (let j = 0; j < this.height; j++) {
        this.board[j] = [];
        this.board[j].deleted = false;
    }

    this.gameReset();
}

Game.Type = {
    finite: 1,
    infinite: 2,
};

Game.Mode = {
    endless: 1,
    countdown: 2,
    cleanup: 3,
};

Game.modeToType = [];
Game.modeToType[Game.Mode.endless] = Game.Type.infinite;
Game.modeToType[Game.Mode.countdown] = Game.Type.finite;
Game.modeToType[Game.Mode.cleanup] = Game.Type.finite;

Game.prototype.randomByte = function (maxExclusive) {
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
};


Game.prototype.boardClear = function () {
    for (let j = 0; j < this.height; j++) {
        for (let i = 0; i < this.width; i++) {
            this.board[j][i] = 0;
        }
    }
};

Game.prototype.boardAddGarbage = function () {
    for (let j = 0 ;j < 12; j++) {
        let valid = false;
        do {
            for (let i = 0; i < this.width; i++) {
                if (this.randomByte(100) < 45) {
                    this.board[j][i] = this.randomByte(Constants.pieces.length) + 1;
                } else {
                    this.board[j][i] = 0;
                    valid = true;
                }
            }
        } while (!valid);
    }
};

Game.prototype.boardOccupied = function (i, j) {
    return this.board[j][i] !== 0;
};

Game.prototype.boardRemoveRow = function (j) {
    this.board[j].deleted = true;
};

Game.prototype.boardExpungeRows = function () {
    let destination = -1;
    for (let j = 0; j < this.height; j++) {
        let deleted = this.board[j].deleted;
        if (deleted) {
            this.board[j].deleted = false;
        } else {
            destination++;
        }

        if (!deleted) {
            for (let i = 0; i < this.width; i++) {
                this.board[destination][i] = this.board[j][i];
            }
        }
    }

    for (let j = destination + 1; j < this.height; j++) {
        for (let i = 0; i < this.width; i++) {
            this.board[j][i] = 0;
        }
    }
};

Game.prototype.boardClean = function () {
    let cleared = 0;
    for (let j = 0; j < this.height; j++) {
        let completed = true;
        for (let i = 0; i < this.width; i++) {
            if (!this.boardOccupied(i, j)) {
                completed = false;
                break;
            }
        }

        if (completed) {
            this.boardRemoveRow(j);
            cleared++;
        }
    }

    return cleared;
};

Game.prototype.pieceHide = function () {
    this.pieceIndex = -1;
};

Game.prototype.pieceChooseNext = function () {
    this.pieceNextIndex = this.randomByte(Constants.pieces.length);
};

Game.prototype.pieceAdvance = function () {
    this.pieceHide();
    if (this.pieceNextIndex === -1) {
        this.pieceChooseNext();
    }

    this.pieceIndex = this.pieceNextIndex;
    this.pieceRotationIndex = 0;
    this.pieceChooseNext();
    this.pieceI = 3;
    this.pieceJ = 19;
};

Game.prototype.pieceForEachBlock = function (callback, i0, j0, rotationIndex) {
    let pieceBlocks = Constants.pieces[this.pieceIndex][rotationIndex];
    for (let n = 0; n < pieceBlocks.length; n++) {
        let offsets = pieceBlocks[n];
        let i = i0 + offsets[0];
        let j = j0 + offsets[1];
        if (!callback(i, j)) {
            break;
        }
    }
};

Game.prototype.pieceValidate = function (i, j, rotationIndex) {
    let valid = true;
    const game = this;
    this.pieceForEachBlock(function (i, j) {
        if (i >= 0 && i < game.width && j >= 0) {
            if (j < game.height && game.boardOccupied(i, j)) {
                valid = false;
            }
        } else {
            valid =  false;
        }

        return valid;
    }, i, j, rotationIndex);

    return valid;
};

Game.prototype.pieceTestMove = function (di, dj) {
    return this.pieceValidate(this.pieceI + di, this.pieceJ + dj, this.pieceRotationIndex);
};

Game.prototype.pieceTryMove = function (di, dj) {
    if (this.pieceTestMove(di, dj)) {
        this.pieceI += di;
        this.pieceJ += dj;
        return true;
    }
    return false;
};

Game.prototype.pieceTryMoveDown = function () { return this.pieceTryMove(0, -1); };
Game.prototype.pieceTryMoveLeft = function () { return this.pieceTryMove(-1, 0); };
Game.prototype.pieceTryMoveRight = function () { return this.pieceTryMove(1, 0); };

Game.prototype.pieceComplete = function () {
    const game = this;
    this.pieceForEachBlock(function (i, j) {
        if (i >= 0 && i < game.width && j >= 0 && j < game.height) {
            game.board[j][i] = game.pieceIndex + 1;
        }
        return true;
    }, this.pieceI, this.pieceJ, this.pieceRotationIndex)
};

Game.prototype.pieceMoveDown = function (leftPressed, rightPressed) {
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
            this.timerNextPiece = Constants.nextPieceDelay;

            if (cleared > 0) {
                this.timerNextPiece += Constants.clearDelay;
                // TODO: Communicate back result (for e.g. sound effect)
            }
        }
    }
};

Game.prototype.pieceTryRotate = function (offset) {
    const length = Constants.pieces[this.pieceIndex].length;
    let rotationIndex = (this.pieceRotationIndex + offset + length) % length;
    if (this.pieceValidate(this.pieceI, this.pieceJ, rotationIndex)) {
        this.pieceRotationIndex = rotationIndex;
        return true;
    }
    return false;
};

Game.prototype.pieceRotateCW = function () { return this.pieceTryRotate(-1); }
Game.prototype.pieceRotateCCW = function () { return this.pieceTryRotate(1); }

Game.prototype.gameGetDropPeriod = function () {
    const dropPeriods = Constants.dropPeriods;
    return (this.level < dropPeriods.length) ? dropPeriods[this.level] : dropPeriods[dropPeriods.length - 1];
}

Game.prototype.gameReset = function () {
    this.boardClear();
    if (this.mode === Game.Mode.cleanup) {
        this.boardAddGarbage();
    }

    this.pieceIndex = -1;
    this.pieceNextIndex = -1;

    this.pieceAdvance();
    this.score = 0;

    if (this.type === Game.Type.infinite) {
        this.lines = 0;
    } else {
        this.lines = 25;
    }

    this.level = this.initialLevel;
    this.eligibleForHighScore = null;
    this.result = null;
    this.firstDrop = true;
    this.fastDrop = false;
    this.fastDropRow = 0;
    this.fastMove = false;

    this.timerNextPiece = 0;
    this.timerFastMove = 0;
    this.timerDrop = 0;

    this.frame = 0;
};

Game.prototype.gameEnd = function (eligibleForHighScore, successful) {
    this.eligibleForHighScore = eligibleForHighScore;
    this.result = successful;
};

Game.prototype.gameIsDone = function () {
    return this.result !== null;
};

Game.prototype.gameScoreUpdate = function (cleared) {
    let points = 0;
    if (cleared >= 1) {
        points += Constants.clearedToScore[cleared];
        points *= (this.level + 1);

        if (this.type === Game.Type.infinite) {
            this.lines += cleared;
            this.level = Math.max(this.level, Math.floor(this.lines / 10));
        } else {
            this.lines = Math.max(0, this.lines - cleared);
        }
    }

    if (this.fastDrop) {
        points += (this.fastDropRow - this.pieceJ);
    }

    // Max score is 999999
    this.score = Math.min(999999, this.score + points);

    if (this.type === Game.Type.finite && this.lines === 0) {
        this.gameEnd(true, true);
    }
};

Game.prototype.gameAdvanceFrame = function (readInput) {
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
                if (this.pieceIndex >= 0 && !this.pieceValidate(this.pieceI, this.pieceJ, this.pieceRotationIndex)) {
                    this.gameEnd(this.type === Game.Type.infinite, false);
                }
            }

            if (this.result === null) {
                const { upPressed, downPressed, leftPressed, rightPressed, cwPressed, ccwPressed } = readInput();

                if (leftPressed && !this.lastLeftPressed) {
                    this.pieceTryMoveLeft();
                    this.timerFastMove = -Constants.fastMoveInitialDelay;
                }
    
                if (rightPressed && !this.lastRightPressed) {
                    this.pieceTryMoveRight();
                    this.timerFastMove = -Constants.fastMoveInitialDelay;
                }
    
                if (leftPressed || rightPressed) {
                    this.timerFastMove++;
                    while (this.timerFastMove >= Constants.fastMovePeriod) {
                        this.timerFastMove -= Constants.fastMovePeriod;
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
                    this.fastDropRow = this.pieceJ;
    
                    this.timerDrop = Math.min(Math.min(this.timerDrop, Constants.fastDropPeriod), this.gameGetDropPeriod());
                } else if (!downPressed && this.lastDownPressed) {
                    this.fastDrop = false;
                }
    
                if (cwPressed && !this.lastCWPressed) {
                    // TODO: Are these swapped?
                    this.pieceRotateCW();
                }
    
                if (ccwPressed && !this.lastCCWPressed) {
                    this.pieceRotateCCW();
                }
    
                // Drop
                let dropPeriod = this.gameGetDropPeriod();
                if (this.firstDrop) {
                    dropPeriod = Constants.firstDropPeriod;
                }
                if (this.fastDrop) {
                    dropPeriod = Math.min(Constants.fastDropPeriod, dropPeriod);
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
};

Game.prototype.getState = function () {
    // TODO: Use events instead
    return {
        board: this.board,
        piece: (this.pieceIndex >= 0) ? Constants.pieces[this.pieceIndex][this.pieceRotationIndex] : null,

        // TODO: These are swapped!
        pieceI: this.pieceJ,
        pieceJ: this.pieceI,
        pieceIndex: this.pieceIndex,
        // pieceNext: Constants.pieces[this.pieceNextIndex][0],
        // pieceNextIndex: this.pieceNextIndex,
        level: this.level,
        lines: this.lines,
        score: this.score,
    };
};

function Replay(str) {
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

Replay.prototype.start = function () {
    if (!this.started) {
        this.started = true;
        this.game = new Game(this.mode, this.initialLevel, this.seeds);
    }
};

Replay.prototype.nextByte = function () {
    if (this.index >= this.buffer.length) {
        throw new Error(`Tried to read index ${this.index} which is past the end of ${this.buffer.length - 1}!`);
    }
    return this.buffer.charCodeAt(this.index++);
};

Replay.prototype.nextByteAsInput = function () {
    const input = this.nextByte();

    return {
        upPressed: ((input & 0x1) !== 0),
        downPressed: ((input & 0x2) !== 0),
        leftPressed: ((input & 0x4) !== 0),
        rightPressed: ((input & 0x8) !== 0),
        cwPressed: ((input & 0x10) !== 0),
        ccwPressed: ((input & 0x20) !== 0),
    };
};

Replay.prototype.advanceFrame = function () {
    this.start();

    const self = this;
    this.game.gameAdvanceFrame(function () { return self.nextByteAsInput(); });

    return this.game.gameIsDone();
};

Replay.prototype.seekToEnd = function () {
    this.start();
    while (!this.advanceFrame()) {}

    return this.game.score;
};

exports.Game = Game;
exports.Replay = Replay;
