const anybar = require("anybar");
const Timer = require("tiny-timer");
const random = require("random");
const prompt = require("prompt");
const argv = require("yargs").argv;
const colors = require("colors/safe");
const notifier = require("node-notifier");
var fs = require("fs");
var wav = require("wav");
var Speaker = require("speaker");

var file = fs.createReadStream("zen.wav");
var reader = new wav.Reader();

// Setting these properties customizes the prompt.

anybar("exclamation");

prompt.message = argv.auto
    ? colors.red("Auto Mode")
    : colors.blue("Manual Mode");

prompt.message = colors.rainbow("");
prompt.delimiter = colors.green(" (0-9) ");
prompt.start();

var today = new Date();
var tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const timeToBed = today.setHours(23, 0, 0);
const timeToWakeUp = tomorrow.setHours(6, 0, 0);

// get total seconds between the times

function getDelta(now, then) {
    // console.log(then, "now=" + now);
    var delta = Math.abs(then - now) / 1000;
    // console.log(delta);
    // calculate (and subtract) whole days
    let days = Math.floor(delta / 86400);
    delta -= days * 86400;
    // calculate (and subtract) whole hours
    let hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;
    // calculate (and subtract) whole minutes
    let minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;
    // what's left is seconds
    let seconds = delta % 60;
    // in theory the modulus is not required
    return { d: days, h: hours, m: minutes, s: Math.round(seconds) };
}

let loop = function () {
    // the "format" event gets emitted at the end of the WAVE header
    reader.on("format", function (format) {
        // the WAVE header is stripped from the output of the reader
        reader.pipe(new Speaker(format));
    });
    const bedTime = getDelta(Date.now(), timeToBed);
    const upTime = getDelta(Date.now(), timeToWakeUp);

    const hoursToBed = `${bedTime.h} hours, ${bedTime.m} minutes, ${bedTime.s} seconds`;
    const hoursToWake = `${upTime.h} hours, ${upTime.m} minutes, ${upTime.s} seconds`;

    const notifications = [
        "Where are you going?",
        "Deep Breath!",
        `Wake up time in ${hoursToWake}!`,
        "POSTURE!",
        `Bedtime in ${hoursToBed}`,
        `1 THING, TO THE EXCLUSION OF EVERYTHING ELSE`,
        "HYDRATE!",
        "👂",
    ];

    let anybarToggle = false;

    notifier.notify({
        title: "Attention!",
        message:
            notifications[random.int((min = 0), (max = notifications.length))],
    });

    anybar("question");

    let timer = new Timer([{ interval: 1000, stopwatch: false }]);
    let pauseTimer = new Timer([{ interval: 1000, stopwatch: false }]);
    let autoNext = random.int((min = 60000), (max = 600000));

    if (argv.auto) {
        console.log(`auto mode = ${argv.auto}, verbose = ${argv.verbose}`);
        file.pipe(reader);

        timer.start(autoNext);
    } else {
        file.pipe(reader);

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
                timer.start(random.int(60000, Number(res.howfar) * 60000));
                // run for x seconds
            }
        );
    }

    timer.on("tick", (ms) => {
        pauseTimer.start(2000);
    });

    pauseTimer.on("done", () => {
        anybarToggle = !anybarToggle;

        autoNext -= 2000;
        let next = getDelta(Date.now(), Date.now() + autoNext);

        if (argv.verbose) {
            console.log(
                "Next buzz in " + next.m + " minutes " + next.s + " seconds "
            );
            // console.log("to bed: " + hoursToBed, "to wake up: " + hoursToWake);
        }
        anybarToggle ? anybar("blue") : anybar("red");
    });

    timer.on("done", () => {
        console.log("done!");
        anybar("green");
        timer.stop();
        loop();
    });

    timer.on("statusChanged", (status) => {
        console.log("status:", status);
    });
};

loop();
