var helpers = require('./helpers');
var events = require('events');
var rpio = helpers.getRpio(process.platform);

class MotionSensorEmitter extends events.EventEmitter {
    constructor(pin) {
        super();

        this.pin = pin;
        this.state = null;

        rpio.open(pin, rpio.INPUT);

        // Don't start polling for a minute, this is about how long it takes
        // for the motion sensor to boot up
        setTimeout(() => {
            console.log('Motion sensor ready');
            this.emit('ready');
            this.readChange();
            rpio.poll(pin, () => this.readChange());
        }, 60 * 1000);

        process.on('exit', () => this.cleanup());
        process.on('SIGINT', () => this.cleanup());
    }
    readChange() {
        console.log('Reading motion sensor for change');

        var currentState = this.read();
        if (currentState !== this.state) {
            console.log(`State changed from ${currentState} to ${this.state}`);
            this.emit('state', this.state = currentState);
        }
    }
    read() {
        return rpio.read(this.pin);
    }
    cleanup() {
        rpio.close(this.pin, rpio.PIN_PRESERVE);
        this.eventNames().forEach(
            (eventName) => this.removeAllListeners(eventName));
    }
}

module.exports = function (pin) {
    return new MotionSensorEmitter(pin);
};