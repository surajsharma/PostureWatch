const anybar = require("anybar");
const Timer = require("tiny-timer");
const random = require("random");
const readline = require("readline");
const prompt = require("prompt");
const { exec } = require("child_process");
const argv = require("yargs").argv;
var colors = require("colors/safe");

//
// Setting these properties customizes the prompt.
//

anybar("exclamation");

console.log(argv.auto);

prompt.message = colors.rainbow("");
prompt.delimiter = colors.green(" (0-9) ");
prompt.start();

let loop = function () {
    exec("afplay /System/Library/Sounds/Glass.aiff");
    exec("osascript -e 'display notification \"POSTURE!\"'");
    anybar("question");

    let timer = new Timer([{ interval: 1000, stopwatch: false }]);
    let pauseTimer = new Timer([{ interval: 1000, stopwatch: false }]);

    if (argv.auto) {
        console.log("auto mode");
        timer.start(random.int(90000));
    } else {
        prompt.get(
            {
                properties: {
                    howfar: {
                        description: colors.green(
                            "Rate your posture (1-9), 0 to quit: "
                        ),
                    },
                },
            },
            (err, res) => {
                if (res.howfar === "0") {
                    return process.kill(process.pid);
                }
                timer.start(random.int(60000, Number(res.howfar) * 10000));
                // run for x seconds
            }
        );
    }
    timer.on("tick", (ms) => {
        anybar("blue");
        pauseTimer.start(2000);
    });

    pauseTimer.on("done", () => {
        console.log("pause done");
        anybar("red");
    });

    timer.on("done", () => {
        console.log("done!");
        anybar("green");
        timer.stop();
        loop();
    });

    timer.on("statusChanged", (status) => console.log("status:", status));
};

loop();

// run for x seconds
// timer.stop()
// timer.pause()
// timer.resume()
//events -> .on/done/statusChanged('tick'/'done'/'statusChanged', (ms/status) => {})
//properties timer.time, timer.duration, timer.status
