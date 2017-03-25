var helpers = require('./helpers');
var events = require('events');
var analogRead = require('./analogRead');
var rpio = helpers.getRpio(process.platform);

var analogTimeoutTimeInMs = 5000; // 5 seconds

class LightSensorEmitter extends events.EventEmitter {
    constructor(digitalPin, analogPin) {
        super();

        rpio.open(this.digitalPin = digitalPin, rpio.INPUT);
        rpio.open(this.analogPin = analogPin, rpio.INPUT);
        rpio.poll(this.digitalPin, () => this.readAndEmit());

        this.readAndEmit(); // initial reading

        process.on('exit', () => this.cleanup());
        process.on('SIGINT', () => this.cleanup());
    }
    read() {
        return rpio.read(this.digitalPin);
    }
    readAndEmit() {
        var state = this.read();
        if (state === rpio.HIGH) {
            analogRead.readRC(this.analogPin, analogTimeoutTimeInMs)
                .then((numTicks) => {
                    this.emit('state', numTicks);
                })
                .catch(() => {
                    console.error(`Failed to read analog pin ${this.analogPin} go HIGH 
                        within ${analogTimeoutTimeInMs}ms`);
                });
        }
        return state;
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