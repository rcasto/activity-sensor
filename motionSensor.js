var config = require('./config.json');
var helpers = require('./helpers');
var events = require('events');
var rpio = helpers.getRpio();

function init() {
    var eventEmitter = new events.EventEmitter();

    rpio.open(config.motionSensorPin, rpio.INPUT, rpio.PULL_UP);
    rpio.poll(config.motionSensorPin, readSensor, rpio.POLL_BOTH);

    eventEmitter.emit('state', rpio.HIGH);

    return eventEmitter;
}

function readSensor(pin) {
}

module.exports = init;