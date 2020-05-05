const anybar = require("anybar");
const Timer = require("tiny-timer");
const random = require("random");
const prompt = require("prompt");
const argv = require("yargs").argv;
const colors = require("colors/safe");
const notifier = require("node-notifier");
const player = require("node-wav-player");
const clear = require("clear");
const figlet = require("figlet");
// Setting these properties customizes the prompt.

anybar("exclamation");

prompt.message = argv.auto
    ? colors.red("Auto Mode")
    : colors.blue("Manual Mode");

prompt.message = colors.rainbow("");
prompt.delimiter = colors.green(" (0-9) ");
prompt.start();

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
    var today = new Date();
    var tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeToBed = today.setHours(23, 0, 0);
    const timeToWakeUp = tomorrow.setHours(6, 0, 0);

    const bedTime = getDelta(Date.now(), timeToBed);
    const upTime = getDelta(Date.now(), timeToWakeUp);

    const hoursToBed = `${bedTime.h} hours, ${bedTime.m} minutes, ${bedTime.s} seconds`;
    const hoursToWake = `${upTime.h} hours, ${upTime.m} minutes, ${upTime.s} seconds`;

    const notifications = [
        "PUSHUPS!",
        "DIAPHRAGM!",
        `6AM Wake Up! in ${hoursToWake}!`,
        "POSTURE!",
        `11PM Bedtime in ${hoursToBed}`,
        `1 THING, TO THE EXCLUSION OF EVERYTHING ELSE`,
        "HYDRATE!",
        "PLANK!",
        "BACK TO WORK!",
        "STAND UP!!",
        "Dominant Question?",
    ];

    const sounds = ["zen.wav", "gong.wav"];
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];

    console.log(randomSound);

    let anybarToggle = false;

    notifier.notify({
        title: "Attention!",
        message:
            notifications[Math.floor(Math.random() * notifications.length)],
    });

    anybar("question");

    let timer = new Timer([{ interval: 1000, stopwatch: false }]);
    let pauseTimer = new Timer([{ interval: 1000, stopwatch: false }]);
    let autoNext = random.int((min = 60000), (max = 600000));

    if (argv.auto) {
        console.log(`auto mode = ${argv.auto}, verbose = ${argv.verbose}`);
        player
            .play({
                path: "./" + randomSound,
            })
            .then(() => {
                console.log("The wav file started to be played successfully.");
            })
            .catch((error) => {
                console.error(error);
            });
        timer.start(autoNext);
    } else {
        player
            .play({
                path: "./" + randomSound,
            })
            .then(() => {
                console.log("The wav file started to be played successfully.");
            })
            .catch((error) => {
                console.error(error);
            });
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
            clear();

            figlet.text(
                next.m + " : " + next.s,
                {
                    font: "ANSI Shadow",
                    horizontalLayout: "default",
                    verticalLayout: "default",
                },
                function (err, data) {
                    if (err) {
                        console.log("Something went wrong...");
                        console.dir(err);
                        return;
                    }
                    console.log(data);
                }
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
