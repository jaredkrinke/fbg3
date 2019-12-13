const assert = require("assert");
const fbg = require("../src/fbg-lib.js");

describe("fbg-lib", function () {
    describe("Replay", function () {
        const replayEndlessString = "A4M4OQnwrAfgNQBAMwDEBZBugcAcQI4DfAgAJAAQAAFdWbdTbY/c8wCDsesUBAvf/AwUOG8u1TvU5ipVKSPkipS5StUcAYAq3dxAEn0GABCxOmz9bSOaGAFHZuUKt+zeMtLltV+9f1fj7x+6uzinLqGEVQR0ZHUAfJOMYa6UprxwpIG+so86XwcWdkSudrBStYxJdwARNV85mwS/EA==";
        const replayEndless = new fbg.Replay(replayEndlessString);
        it("Endless replay seed should be 70e69cf9357eac1033469abb0e4771fb", function () {
            assert.equal(replayEndless.seeds[0], 0xf99ce670|0);
            assert.equal(replayEndless.seeds[1], 0x10ac7e35|0);
            assert.equal(replayEndless.seeds[2], 0xbb9a4633|0);
            assert.equal(replayEndless.seeds[3], 0xfb71470e|0);
        });

        it("Endless replay mode should be 1", function () {
            assert.equal(replayEndless.mode, fbg.Game.Mode.endless);
        });

        it("Endless replay initial level should be 9", function () {
            assert.equal(replayEndless.initialLevel, 9);
        });
    
        // TODO: Score of 122
    });
});
