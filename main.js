var config = require('./config');
var helpers = require('./lib/helpers');
var motionSensor = require('./sensorEmitters/motionSensor')(config.motionSensorPin);
var lightSensor = require('./sensorEmitters/lightSensor')(config.lightSensorPin);
var rpio = helpers.getRpio(process.platform);

var activityMap = {};
var activityState = config.initialState > 0 ? rpio.HIGH : rpio.LOW;

function init() {
    helpers.log(`Initializing activity monitor`);
    
    rpio.open(config.outputPin, rpio.OUTPUT, activityState);

    // Motion sensor activity
    motionSensor.on('ready', () => helpers.log('Motion sensor is now ready'));
    motionSensor.on('state', activityMonitor);
    motionSensor.on('error', onError);

    // Light sensor activity
    lightSensor.on('state', activityMonitor);
    lightSensor.on('error', onError);

    /* Read light sensor initially, the motion sensor takes time
       to boot up and will report when ready */
    lightSensor.readAndEmit();

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
}

function activityMonitor(event) {
    helpers.log(`${event.type} reported ${event.state === rpio.HIGH ? 'activity' : 'inactivity'}`);
    setActivity(event.type, event.state);
    /*
        When the timer for one sensor reports an inactive period for the specified time, it does not
        mean the system turns off immediately.  Other sensor reports are checked for activity, if there is
        any the system stays.  Only once all sensors report inactivity will the system shut off
    */
    if (event.state === rpio.LOW) {
        activityMap[event.type].timeoutId = setTimeout(() => {
            helpers.log(`${event.type} inactive for ${config.activityTimeoutInMs}ms`);
            setActivity(event.type);
            if (!isAnyActivity()) {
                helpers.log(`All system components inactive, turning off`);
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
        .some((sensorType) => activityMap[sensorType].state === rpio.HIGH ||
                              activityMap[sensorType].timeoutId);
}

function onError(error) {
    console.error(`Error occurred: ${error}`);
}

function cleanup() {
    resetActivity();
    rpio.close(config.outputPin);
}

init();