import "mocha";
import * as assert from "assert";
import * as fbg from "./fbg-lib";

describe("fbg-lib", function () {
    describe("ReplayEndless", function () {
        const replayString = "A4M4OQnwrAfgNQBAMwDEBZBugcAcQI4DfAgAJAAQAAFdWbdTbY/c8wCDsesUBAvf/AwUOG8u1TvU5ipVKSPkipS5StUcAYAq3dxAEn0GABCxOmz9bSOaGAFHZuUKt+zeMtLltV+9f1fj7x+6uzinLqGEVQR0ZHUAfJOMYa6UprxwpIG+so86XwcWdkSudrBStYxJdwARNV85mwS/EA==";
        const replay = new fbg.Replay(replayString);
        it("Seed should be 70e69cf9357eac1033469abb0e4771fb", function () {
            assert.equal(replay["seeds"][0], 0xf99ce670|0);
            assert.equal(replay["seeds"][1], 0x10ac7e35|0);
            assert.equal(replay["seeds"][2], 0xbb9a4633|0);
            assert.equal(replay["seeds"][3], 0xfb71470e|0);
        });

        it("Mode should be 1", function () {
            assert.equal(replay["mode"], fbg.GameMode.endless);
        });

        it("Initial level should be 9", function () {
            assert.equal(replay["initialLevel"], 9);
        });

        it("Final score should be 122", function () {
            assert.equal(replay.seekToEnd(), 122);
        });
    });

    describe("ReplayCountdown", function () {
        const replayString = "BwVwngJwFQjA0wA4FVQIZQAoF2AdBzgIAAAACEoogCGsoorJIApmaa72OODufe/+Bg/kQAgYgCSTx5CiKnT2YkRyVjRSikK3bBqgCgHDR1SdNnzSgGDWb1nfe50GDWabsPiHZ2XYeBnAM0/YPZWajowjnCA4Nj/QLpVFQ1fLQjIhLieGzUABHz8vTVEpKIsrICw2gTA8qFOakZnRgzUuv5LCy7unvNbS3aO62LFFKDBvhqp6ZnZufmS5QX1Edl5cVcTTdLl9Nb5wd2j0P2q46cyZhbo89u7mYmee+fzI5J1mW2xtsEos7L6lEABggkF7G4xQ4UShXZiff5UfZcdoBXqqdaSNFYkT9WIAIjx3h8CJ+8VqZIWvGxS3mrXyoNyc0enmerJe1I5bnc5WOTFh1QSVQFkJCyU54p6fxJqLRA3s916GIlyupbLVpJZNR29He4hpiy2s1i7AKpsZZk4zPV1vuFSmRMtcU42tI8h8X31jvlOucKxdmQcgSR0yFwq0odhLFD0ZjrAAUMzfsshXc7WqLA9tIEVTn+nKsw0U1KIV6PJt2LrMex1jSXdqTPnvdMugG0uCbtLMwXmxaxd8PcUyPJ/QdAQFfRcJ33PWqhaCwqCQbHl53SAxrkXTkXxk9eS4ffvBaHW93RoauxTlt0jMYc7LuY4ZjGaqwmWObVfTKMMZTfqozbkdYjh+1qXrsd7UjYmoejKwEnrMwYgUhqa7uqrCLouK5Ya+Sb3K+dyIZC9reEcvDYTQkZRuRWEXtwEGcgCFIMJiX41LhzwkchXHccc+HQmw/ECYiGSPnc65Ucs7EgSY0jOHq05HnxPGjrwcy9kOUgVvIZ5wchUk2sIgkws4QmEX6I5tlqukDscqkRpG1FhAmuiKhiUh3lBYHjs01xwoehZKVM+m3JxyL8Kx6iGKa5mrLB/ZhV5XxOMOa4aSkrw7vwQqURujnRs5iaTLcEW0YlykrG5OZBgy+RGcKZm2YZPZjPRvQPqhrJbjQi6MlxrX9WY1gzBmBrxRqH5ZWElF5TN1BxvNVq0lc7rCcKKE6J0A0cpZ47TatJZBdo81TdNs2hgtEyzOeMHkuG2WnWdsYFVkQA==";
        const replay = new fbg.Replay(replayString);
        it("Mode should be 2", function () {
            assert.equal(replay["mode"], fbg.GameMode.countdown);
        })

        it("Final score should be 3948", function () {
            assert.equal(replay.seekToEnd(), 3948);
        });
    });

    describe("ReplayCleanup", function () {
        const replayString = "BUeIkgfwjQnwHACQBAGwAxBrA3gfoNIDFAwAABnkWVXU2131JIAULLABGY10vdQEADBQ4cN70ACJMliyIucIBgAEBWq16jZq3alCvfoXy+Mk6bM11AEkttbbS+vI6ZR43Q1jXIqt0rce/owUvubmXm6hkVEmdnYkgfSulKxMHPH+LuERkY5UUlKeWfLRZDpW1hUOZdVqZkUyjAAYzdKBPHRFQjKalJ1dZkqVaWT21sNmIRRe0QlTxaW5JFq08owpLG2bW5sAUHs79TTc60zbZ237B0b77VG2lQ5OtSbySgAoH59fbzW/qgYAgH+E7rc5bS4QvaCX60P6/fRZEixWwMDL8RHBLjsFGTdJcFadJaqdzPJ5qb5fOEaPR9EkqCiLXh9eZhZklOn0snE0J9VQPaxUwXqAHMln0Zbs3qEo6BEFg+XgyFyIUq4UIw6YrY+NpUUWS/VRWXI4b47Wzdk6zhnRJySjI8i2UEE5l6UlEzkLHqmUUCA0ch3G3ibP0h0NhsPchmkr0lX36iUdDG8LQPVVp2oa8wx51GKh2Vi3K1omh6u328PkVyafnplUGfoVxPeKNujyN9svbKe7lWUZVbtcluM2Nd8hY1KO014oKFJIdxvF83RMXt8J+U35gtFmcd0vz6ibndjqdN6UWFRvfLid1u/d3qi1uGGNcmNtc29kK8fYedn1xkzbCcCrAdw+x9Jco5hn+DahD+2Z0Fe0isnu973l+PwPh6g4hrSbRyiBBFLpWZ6ofegxDDeWE3kOP5SnO5DoT8H6ZNB/6kR2/gtFIjQnuxfH8S+/HzkmFD5M0PHFkJUmRIJ0l3mwKSFpJtC4iW4S9rE1AJixWTKNWlSPtU9a2vqmkUIGOn0eGuLKWprwaPyAqGUZz6uEAA==";
        const replay = new fbg.Replay(replayString);
        it("Mode should be 3", function () {
            assert.equal(replay["mode"], fbg.GameMode.cleanup);
        })

        it("Final score should be 2748", function () {
            assert.equal(replay.seekToEnd(), 2748);
        });
    });

    describe("ReplayHighScoreCountdown", function () {
        const replayString = "FEGovgtw/g5wXgdgPYAEAaBFMBbAagPACABIAEnIssoBBa76HHaqKAAdjzp29wv/gYKHDhAIgAEk9s3KTx0npyXKVqteo2atHbnU4AIQ0fZHTrQ9vUNLnESOVnzpi0+M33tuwIBgTFuV1AoOC6bzDvL0ihFQAEGIAURLiFPR1uD2UvDK5GUjk5dyio9jjSsoAMR2zqmtq65xcNIuFlf2o6zWbBFMVWdNVrDs7upSqGgApxcenx/Q9U1Qa5jwElmfXppa3tnccu/kXGkyWh08sWmyZ2SSo0q7OHof11+ScN8Yzmuv2vx7//gGAjhCbiJMHgkKQqHAn4HejXcQ0dp9frDZpQjGYiLNLbvWa7AmEtywhxGfJTTaHNzue4qLoozGMyHhWGEBm9VGfVkCTQ3JFAmFFNTbAUAg4qZylcrS5auI7ODgEpT7dncNpM3RhX6qnLw6ok0WWREUPTG0h6WlKQYMmxjBodbXHRr2law3EbIme3b/ewqQZyAILXSG2rRO7tfLm1LBkOx5TkqSPbmMcEQjXp+jYx3aMplLSMOOivXh5EOuwMfyBjMalmRUaGab5Vh4wt04oGZ6NuT42VbQrZyTvWWuJMDhOWa1Uo6tnrVucZs50WSJ/teCZDr2bz2qdFBVOJechVhCgs6SiJ0/nH7KOLSu/U7Lcvgz0erakKp0P07FScovKRqMOV/LQhT9ahzykYD1H2NYPS3eCFQNDpcxfZVfV1INizFUDhTtGYmyqVDtGffMKybVgE1eAYsNDEYwOXKiiJENUWEPYJeGvUkv3rQiiNFfQ73vYdH0iXIqDY4JwikrUeUvdkMNLPj1BdEoYkEmIRKiWD1gQnYACg9KfIA=";
        const replay = new fbg.Replay(replayString);
        it("Mode should be 2", function () {
            assert.equal(replay["mode"], fbg.GameMode.countdown);
        })

        it("Final score should be 72783", function () {
            assert.equal(replay.seekToEnd(), 72783);
        });
    });
});
