const LZString = require("lz-string");
const xorwow = require("./xorwow.js");

const Constants = {
    boardWidth: 10,
    boardHeight: 20,
    clearedToScore: [ null, 40, 100, 300, 1200 ],
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

function Board() {
    this.width = Constants.boardWidth;
    this.height = Constants.boardHeight;
}

function Game() {

}

Game.Mode = {
    endless: 1,
    countdown: 2,
    cleanup: 3,
};

Game.prototype.reset = function () {

};

function Replay(str) {
    this.buffer = LZString.decompressFromBase64(str);
    this.index = 0;
    this.seeds = [];

    // Read four 4-byte seed values
    for (let i = 0; i < 4; i++) {
        let seed = 0;
        for (let j = 0; j < 4; j++) {
            seed |= (this.buffer.charCodeAt(this.index++) << (j * 8));
        }
        this.seeds.push(seed);
    }

    // TODO: Anything else?
}

exports.Game = Game;
exports.Replay = Replay;
