var helpers = require('./helpers');
var timeoutPromise = require('./timeoutPromise');
var rpio = helpers.getRpio(process.platform);

function readRC(analogPin, timeBeforeTimeoutInMs = 3000, timeToDischargeInMs = 500) {
    console.log('Reading analog');
    var analogReadPromise = new Promise((resolve) => {
        var numTicks = 0;
        // discharge the capacitor first
        console.log('Discharging capacitor');
        dischargeCapacitor(analogPin, timeToDischargeInMs);
        // start charging it back up, counting ticks
        console.log('Recharging capacitor');
        while(rpio.read(analogPin) === rpio.LOW) {
            numTicks++;
        }
        resolve(numTicks);
    });
    var analogTimeoutPromise = timeoutPromise(timeBeforeTimeoutInMs, false);
    return Promise.race([analogReadPromise, analogTimeoutPromise]);
}

function dischargeCapacitor(analogPin, timeToDischargeInMs = 500) {
    rpio.write(analogPin, rpio.LOW);
    rpio.mode(analogPin, rpio.OUTPUT);
    rpio.msleep(timeToDischargeInMs);
    rpio.mode(analogPin, rpio.INPUT);
}

module.exports = {
    readRC,
    dischargeCapacitor
};