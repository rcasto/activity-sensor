var config = require('./config');
var motionSensor = require('./motionSensor')(config.motionSensorPin);
var helpers = require('./helpers');
var rpio = helpers.getRpio();

function init() {
    rpio.open(config.outputPin, rpio.OUTPUT, rpio.HIGH);
    // rpio.poll(config.outputPin, () => console.log('test'));

    motionSensor.on('state', (state) => {
        console.log(state);
        rpio.write(config.outputPin, state);
    });
    motionSensor.on('error', (err) => console.error(err));

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
}

function cleanup() {
    rpio.close(config.outputPin, rpio.PIN_PRESERVE);
}

init();