var helpers = require('./helpers');
var events = require('events');
var rpio = helpers.getRpio(process.platform);

var initializationTimeoutInMs = 60000; // 1 minute
var blockTimeoutTimeInMs = 60000; // 1 minute

class MotionSensorEmitter extends events.EventEmitter {
    constructor(pin) {
        super();

        rpio.open(this.pin = pin, rpio.INPUT);

        // Don't start polling for a minute, this is about how long it takes
        // for the motion sensor to boot up
        this.initializationTimeoutId = setTimeout(() => {
            this.emit('ready');
            this.readAndEmit(); // initial reading
            rpio.poll(pin, () => this.readAndEmit());
        }, initializationTimeoutInMs);

        process.on('exit', () => this.cleanup());
        process.on('SIGINT', () => this.cleanup());
    }
    read() {
        return rpio.read(this.pin);
    }
    readAndEmit() {
        var state = this.read();
        this.emit('state', state);
        return state;
    }
    cleanup() {
        clearTimeout(this.initializationTimeoutId);
        rpio.close(this.pin, rpio.PIN_PRESERVE);
        this.eventNames().forEach(
            (eventName) => this.removeAllListeners(eventName));
    }
}

module.exports = function (pin) {
    return new MotionSensorEmitter(pin);
};