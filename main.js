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
    var activity = getActivity(event.type);
    clearActivityDebounce(event.type);
    activity.activityDebounce = setTimeout(() => {
        helpers.log(`${event.type} reported ${event.state === rpio.HIGH ? 'activity' : 'inactivity'}`);
        /*
            When the timer for one sensor reports an inactive period for the specified time, it does not
            mean the system turns off immediately.  Other sensor reports are checked for activity, if there is
            any the system stays.  Only once all sensors report inactivity will the system shut off
        */
        if (event.state === rpio.LOW) {
            activity.inactivityDebounce = setTimeout(() => {
                helpers.log(`${event.type} inactive for ${config.activityTimeoutInMs}ms`);
                clearInactivityDebounce(event.type);
                if (!isAnyActivity()) {
                    helpers.log(`All system components inactive, turning off`);
                    rpio.write(config.outputPin, activityState = rpio.LOW);
                }
            }, config.activityTimeoutInMs);
        }
        if (activityState === rpio.LOW) {
            rpio.write(config.outputPin, activityState = rpio.HIGH);
        }
    }, config.logDebounceTimeoutInMs);
}

function resetActivity() {
    Object.keys(activityMap)
        .forEach((sensorType) => {
            clearActivityDebounce(sensorType);
            clearInactivityDebounce(sensorType);
            activityMap[sensorType].state = rpio.LOW;
        });
}

function getActivity(type) {
    return activityMap[type] || (activityMap[type] = {
        inactivityDebounce: null,
        activityDebounce: null,
        state: rpio.LOW
    });
}

function clearActivityDebounce(type) {
    if (activityMap[type]) {
        clearTimeout(activityMap[type].activityDebounce);
        activityMap[type].activityDebounce = null;
    }
}

function clearInactivityDebounce(type) {
    if (activityMap[type]) {
        clearTimeout(activityMap[type].inactivityDebounce);
        activityMap[type].inactivityDebounce = null;
    }
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