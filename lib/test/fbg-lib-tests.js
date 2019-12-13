const assert = require("assert");
const fbg = require("../src/fbg-lib.js");

describe("fbg-lib", function () {
    describe("Replay", function () {
        const replayString = "A4M4OQnwrAfgNQBAMwDEBZBugcAcQI4DfAgAJAAQAAFdWbdTbY/c8wCDsesUBAvf/AwUOG8u1TvU5ipVKSPkipS5StUcAYAq3dxAEn0GABCxOmz9bSOaGAFHZuUKt+zeMtLltV+9f1fj7x+6uzinLqGEVQR0ZHUAfJOMYa6UprxwpIG+so86XwcWdkSudrBStYxJdwARNV85mwS/EA==";
        it("Seed should be 70e69cf9357eac1033469abb0e4771fb", function () {
            const replay = new fbg.Replay(replayString);
            assert.equal(replay.seeds[0], 0xf99ce670|0);
            assert.equal(replay.seeds[1], 0x10ac7e35|0);
            assert.equal(replay.seeds[2], 0xbb9a4633|0);
            assert.equal(replay.seeds[3], 0xfb71470e|0);
        });
    
        // TODO: Mode, height, score of 122
    });
});
