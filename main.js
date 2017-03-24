var config = require('./config');
var motionSensor = require('./motionSensor')(config.motionSensorPin);
var helpers = require('./helpers');
var rpio = helpers.getRpio(process.platform);

function init() {
    console.log(`Initializing activity monitor`);
    
    rpio.open(config.outputPin, rpio.OUTPUT, rpio.HIGH);

    motionSensor.on('state', (state) => {
        console.log(`State Update: ${state}`);
        rpio.write(config.outputPin, state);
    });
    motionSensor.on('error', (err) => console.error(`Error occurred: ${err}`));

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
}

function cleanup() {
    rpio.close(config.outputPin, rpio.PIN_PRESERVE);
}

init();