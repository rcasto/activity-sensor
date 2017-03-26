var helpers = require('./helpers');
var events = require('events');
var analog = require('./analog');
var rpio = helpers.getRpio(process.platform);

var analogTimeoutTimeInMs = 5000; // 5 seconds

class LightSensorEmitter extends events.EventEmitter {
    constructor(digitalPin, analogPin) {
        super();

        rpio.open(this.digitalPin = digitalPin, rpio.INPUT);
        rpio.open(this.analogPin = analogPin, rpio.INPUT);
        analog.dischargeCapacitor(this.analogPin);
        rpio.poll(this.digitalPin, () => this.readDigital(), rpio.POLL_HIGH);

        process.on('exit', () => this.cleanup());
        process.on('SIGINT', () => this.cleanup());
    }
    readDigital() {
        this.emit('state', rpio.read(this.digitalPin));
    }
    readAnalog() {
        analog.readRC(this.analogPin, analogTimeoutTimeInMs)
            .then((numTicks) => {
                this.emit('state', numTicks);
            }, () => {
                console.error(`Failed to read analog pin ${this.analogPin} go HIGH within ${analogTimeoutTimeInMs}ms`);
            });
    }
    cleanup() {
        rpio.close(this.digitalPin);
        rpio.close(this.analogPin);
        this.eventNames().forEach(
            (eventName) => this.removeAllListeners(eventName));
    }
}

module.exports = 
    (digitalPin, analogPin) => new LightSensorEmitter(digitalPin, analogPin);