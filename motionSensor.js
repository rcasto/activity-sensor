var helpers = require('./helpers');
var events = require('events');
var rpio = helpers.getRpio(process.platform);

// var initializationTimeoutInMs = 60000; // 1 minute
var initializationTimeoutInMs = 5000;
var blockTimeoutTimeInMs = 60000; // 1 minute

var analogPin = 23;

class MotionSensorEmitter extends events.EventEmitter {
    constructor(pin) {
        super();

        rpio.open(this.pin = pin, rpio.INPUT);
        rpio.open(analogPin, rpio.INPUT);

        // Don't start polling for a minute, this is about how long it takes
        // for the motion sensor to boot up
        this.initializationTimeoutId = setTimeout(() => {
            this.emit('ready');
            // this.readAndEmit(); // initial reading
            rpio.poll(pin, () => this.readAndEmit());
        }, initializationTimeoutInMs);

        process.on('exit', () => this.cleanup());
        process.on('SIGINT', () => this.cleanup());
    }
    readRC() {
        return new Promise((resolve) => {
            var numTicks = 0;
            // discharge the capacitor
            rpio.write(analogPin, rpio.LOW);
            rpio.mode(analogPin, rpio.OUTPUT);
            rpio.msleep(500);
            // start charging it back up, counting ticks
            rpio.mode(analogPin, rpio.INPUT);
            while(rpio.read(analogPin) === rpio.LOW) {
                numTicks++;
            }
            resolve(numTicks);
        });
    }
    read() {
        return rpio.read(this.pin);
    }
    readAndEmit() {
        var state = this.read();
        this.emit('state', state);
        this.readRC()
            .then((numTicks) => console.log(`Analog reading: ${numTicks}`));
        return state;
    }
    cleanup() {
        clearTimeout(this.initializationTimeoutId);
        rpio.close(this.pin, rpio.PIN_PRESERVE);
        rpio.close(analogPin);
        this.eventNames().forEach(
            (eventName) => this.removeAllListeners(eventName));
    }
}

module.exports = function (pin) {
    return new MotionSensorEmitter(pin);
};