const { watch } = require("gulp");
const { exec } = require('child_process');

function runTests(callback) {
    exec("npm test", function (error, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        callback(); // Ignore the actual result
    });
}

function watchAndRunTests() {
    watch(["**/*.js"], runTests);
}

exports.test = runTests;
exports.watch = watchAndRunTests;
