var config = require('./config');
var motionSensor = require('./motionSensor')(config.motionSensorPin);
var helpers = require('./helpers');
var rpio = helpers.getRpio(process.platform);

var activityTimeoutId = null;
var activityTimeoutInMs = 5 * 60 * 1000; // 5 mins
var activityState = rpio.HIGH;

function init(pin) {
    console.log(`Initializing activity monitor`);
    
    // initialize with output high
    rpio.open(config.outputPin, rpio.OUTPUT, activityState);

    // Motion sensor activity
    motionSensor.on('ready', () => console.log('Motion sensor is now ready'));
    motionSensor.on('state', activityMonitor);
    motionSensor.on('error', onError);

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
}

function activityMonitor(state) {
    if (activityState === state) {
        console.log(`Activity detected, staying ${ state === rpio.HIGH ? 'on' : 'off' }`);
        return resetActivityTimer();
    }
    if (state === rpio.LOW) {
        activityTimeoutId = activityTimeoutId || setTimeout(() => {
            console.log(`Inactivity for ${activityTimeoutInMs}ms, turning off`);
            resetActivityTimer();
            rpio.write(config.outputPin, activityState = rpio.LOW);
        }, activityTimeoutInMs);
    } else {
        console.log('Activity detected, turning on');
        resetActivityTimer();
        rpio.write(config.outputPin, activityState = rpio.HIGH);
    }
}

function resetActivityTimer() {
    clearTimeout(activityTimeoutId);
    activityTimeoutId = null;
}

function onError(error) {
    console.error(`Error occurred: ${error}`);
}

function cleanup() {
    resetActivityTimer();
    rpio.close(config.outputPin, rpio.PIN_PRESERVE);
}

init();