const { watch } = require("gulp");
const { spawn } = require('child_process');

function runTests(callback) {
    spawn("npx", [ "mocha" ], { shell: true, stdio: "inherit" })
        .on("close", () => { callback(); });
}

function watchAndRunTests() {
    watch(["**/*.js"], runTests);
}

exports.test = runTests;
exports.watch = watchAndRunTests;
