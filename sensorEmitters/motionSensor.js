var config = require('../config.json');
var helpers = require('../lib/helpers');
var events = require('events');
var rpio = helpers.getRpio(process.platform);

class MotionSensorEmitter extends events.EventEmitter {
    constructor(pin) {
        super();

        rpio.open(this.pin = pin, rpio.INPUT, rpio.PULL_DOWN);

        /* Don't start polling for a minute, this is about how long it takes
           for the motion sensor to boot up */
        this.initializationTimeoutId = setTimeout(() => {
            this.initializationTimeoutId = null;
            this.emit('ready');
            this.readAndEmit(); // initial reading
            rpio.poll(pin, () => this.readAndEmit());
        }, config.initializationTimeoutInMs);

        process.on('exit', () => this.cleanup());
        process.on('SIGINT', () => this.cleanup());
    }
    read() {
        return rpio.read(this.pin);
    }
    readAndEmit() {
        var state = this.read();
        this.emit('state', {
            state: state,
            type: 'motion'
        });
        return state;
    }
    cleanup() {
        this.eventNames().forEach(
            (eventName) => this.removeAllListeners(eventName));
        clearTimeout(this.initializationTimeoutId);
        rpio.close(this.pin);
    }
}

module.exports = (pin) => new MotionSensorEmitter(pin);