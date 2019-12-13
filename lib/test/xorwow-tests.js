const assert = require("assert");
const xorwow = require("../src/xorwow.js");

describe("Xorwow", function () {
    describe("Known seed", function () {
        it("Should return 0xd4d70d6d on 50th iteration", function () {
            let prng = new xorwow.Xorwow(0x0000007b, 0x000001c8, 0x00001a7c, 0x0000238d);
            for (let i  = 0; i < 49; i++) {
                prng.nextUInt32();
            }
            assert.equal(prng.nextUInt32(), 0xd4d70d6d);
        });
    });
});
