var helpers = require('./helpers');
var events = require('events');
var rpio = helpers.getRpio(process.platform);

class LightSensorEmitter extends events.EventEmitter {
    constructor(pin) {
        super();

        rpio.open(this.pin = pin, rpio.INPUT);
        rpio.poll(this.pin, () => this.readDigital());

        process.on('exit', () => this.cleanup());
        process.on('SIGINT', () => this.cleanup());
    }
    readDigital() {
        this.emit('state', rpio.read(this.pin));
    }
    cleanup() {
        rpio.close(this.pin);
        this.eventNames().forEach(
            (eventName) => this.removeAllListeners(eventName));
    }
}

module.exports = (pin) => new LightSensorEmitter(pin);