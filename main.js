var config = require('./config');
var motionSensor = require('./motionSensor')(config.motionSensorPin);
var lightSensor = require('./lightSensor')(config.lightSensorDigitalPin, config.lightSensorAnalogPin);
var helpers = require('./helpers');
var rpio = helpers.getRpio(process.platform);

var activityTimeoutId = null;
var activityState = config.initialState > 0 ? rpio.HIGH : rpio.LOW;

function init(pin) {
    console.log(`Initializing activity monitor`);
    
    rpio.open(config.outputPin, rpio.OUTPUT, activityState);

    // Motion sensor activity
    motionSensor.on('ready', () => console.log('Motion sensor is now ready'));
    motionSensor.on('state', activityMonitor);
    motionSensor.on('error', onError);

    // Light sensor activity
    lightSensor.on('state', activityMonitor);
    lightSensor.on('error', onError);

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
}

function activityMonitor(state) {
    if (activityState === state) {
        console.log(`Activity detected, staying ${ state === rpio.HIGH ? 'on' : 'off' }`);
        return resetActivityTimer();
    }
    /*
        Want to ensure inactivity has occurred for a certain amount of time before shutting off
        Whenever activity is detected this inactivity timer is restarted 
    */
    resetActivityTimer();
    if (state === rpio.LOW) {
        console.log('Inactivity timer started');
        activityTimeoutId = setTimeout(() => {
            console.log(`Inactivity for ${config.activityTimeoutInMs}ms, turning off`);
            resetActivityTimer();
            rpio.write(config.outputPin, activityState = rpio.LOW);
        }, config.activityTimeoutInMs);
    } else {
        console.log('Activity detected, turning on');
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