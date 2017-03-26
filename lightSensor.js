var helpers = require('./helpers');
var events = require('events');
var rpio = helpers.getRpio(process.platform);

class LightSensorEmitter extends events.EventEmitter {
    constructor(pin) {
        super();

        rpio.open(this.pin = pin, rpio.INPUT, rpio.PULL_DOWN);
        rpio.poll(this.pin, () => this.readAndEmit());

        this.readAndEmit(); // initial reading

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
        rpio.close(this.pin);
        this.eventNames().forEach(
            (eventName) => this.removeAllListeners(eventName));
    }
}

module.exports = (pin) => new LightSensorEmitter(pin);