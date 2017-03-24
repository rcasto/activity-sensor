var helpers = require('./helpers');
var events = require('events');
var rpio = helpers.getRpio();

class MotionSensorEmitter extends events.EventEmitter {
    constructor(pin) {
        super();

        this.pin = pin;
        this.state = null;

        rpio.open(pin, rpio.INPUT, rpio.PULL_UP);
        rpio.poll(pin, this.readChange, rpio.POLL_BOTH);
    }
    readChange() {
        var currentState = this.read();
        if (currentState !== this.state) {
            this.emit('state', this.state = currentState);
        }
    }
    read() {
        return rpio.read(this.pin);
    }
}

module.exports = function (pin) {
    return new MotionSensorEmitter(pin);
};