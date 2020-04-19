const anybar = require("anybar");
const Timer = require("tiny-timer");
const random = require("random");
const prompt = require("prompt");
const argv = require("yargs").argv;
const colors = require("colors/safe");
const notifier = require("node-notifier");
var player = require("play-sound")((opts = {}));
var moment = require("moment");

//
// Setting these properties customizes the prompt.
//

anybar("exclamation");
prompt.message = argv.auto
    ? colors.red("Auto Mode")
    : colors.blue("Manual Mode");

prompt.message = colors.rainbow("");
prompt.delimiter = colors.green(" (0-9) ");
prompt.start();

var bedTime = moment.duration("23:00", "HH:mm");
var upTime = moment.duration("05:00", "HH:mm");

let hoursToBed = bedTime.subtract(moment());
let hoursToWake = upTime.subtract(moment());

// var diff = end.subtract(start);
// diff.hours(); // return hours
// diff.minutes(); // return minutes

const notifications = [
    "POSTURE",
    `${hoursToBed} before Bedtime! `,
    `${hoursToWake} hours before Wake up time!`,
];

let loop = function () {
    console.log(hoursToBed.hours(), hoursToWake.hours());
    player.play("./zen.wav", (err) => {
        if (err) throw err;
    });
    notifier.notify({
        title: "Attention!",
        message:
            notifications[random.int((min = 0), (max = notifications.length))],
    });

    anybar("question");

    let timer = new Timer([{ interval: 1000, stopwatch: false }]);
    let pauseTimer = new Timer([{ interval: 1000, stopwatch: false }]);

    if (argv.auto) {
        console.log("auto mode");
        timer.start(random.int((min = 300000), (max = 600000)));
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
