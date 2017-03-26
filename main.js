var config = require('./config');
var motionSensor = require('./sensorEmitters/motionSensor')(config.motionSensorPin);
var lightSensor = require('./sensorEmitters/lightSensor')(config.lightSensorPin);
var helpers = require('./lib/helpers');
var rpio = helpers.getRpio(process.platform);

var activityMap = {};
var activityState = config.initialState > 0 ? rpio.HIGH : rpio.LOW;

function init() {
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

function activityMonitor(event) {
    console.log(`${event.type} reported ${event.state === rpio.HIGH ? 'activity' : 'inactivity'}`);
    setActivity(event.type, event.state);
    /*
        Want to ensure inactivity has occurred for a certain amount of time before shutting off
        Whenever activity is detected this inactivity timer is restarted 
    */
    if (event.state === rpio.LOW) {
        activityMap[event.type].timeoutId = setTimeout(() => {
            console.log(`${event.type} inactive for ${config.activityTimeoutInMs}ms`);
            setActivity(event.type);
            if (!isAnyActivity()) {
                console.log(`All system components inactive, turning off`);
                rpio.write(config.outputPin, activityState = rpio.LOW);
            }
        }, config.activityTimeoutInMs);
    }
    if (activityState === rpio.LOW) {
        rpio.write(config.outputPin, activityState = rpio.HIGH);
    }
}

function resetActivity() {
    Object.keys(activityMap)
        .forEach((sensorType) => setActivity(sensorType));
}

function setActivity(type, state = rpio.LOW) {
    if (activityMap[type]) {
        clearTimeout(activityMap[type].timeoutId);
    }
    return (activityMap[type] = {
        timeoutId: null,
        state: state
    });
}

function isAnyActivity() {
    return Object.keys(activityMap)
        .some((sensorType) => activityMap[sensorType].state === rpio.HIGH);
}

function onError(error) {
    console.error(`Error occurred: ${error}`);
}

function cleanup() {
    resetActivity();
    rpio.close(config.outputPin, rpio.PIN_PRESERVE);
}

init();