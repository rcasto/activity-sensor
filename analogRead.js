var helpers = require('./helpers');
var timeoutPromise = require('./timeoutPromise');
var rpio = helpers.getRpio(process.platform);

function readRC(analogPin, timeBeforeTimeoutInMs = 3000) {
    console.log('Reading analog');
    var analogReadPromise = new Promise((resolve) => {
        var numTicks = 0;
        // discharge the capacitor first
        console.log('Discharging capacitor');
        rpio.write(analogPin, rpio.LOW);
        rpio.mode(analogPin, rpio.OUTPUT);
        rpio.msleep(500); // Make sure it discharges completely
        // start charging it back up, counting ticks
        console.log('Recharging capacitor');
        rpio.mode(analogPin, rpio.INPUT);
        while(rpio.read(analogPin) === rpio.LOW) {
            numTicks++;
        }
        resolve(numTicks);
    });
    var analogTimeoutPromise = timeoutPromise(timeBeforeTimeoutInMs, false);
    return Promise.race(analogReadPromise, analogTimeoutPromise);
}

module.exports = {
    readRC
};