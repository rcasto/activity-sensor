var config = require('./config');
var helpers = require('./lib/helpers');
var motionSensor = require('./sensorEmitters/motionSensor')(config.motionSensorPin);
var lightSensor = require('./sensorEmitters/lightSensor')(config.lightSensorPin);
var rpio = helpers.getRpio(process.platform);
var messengerClient = require('messenger').client;

var connectionUrl = `${config.remoteProtocol}://${config.remoteHost}:${config.remotePort}`;
var socket = null;

function init() {
    helpers.log(`Initializing activity monitor`);

    /* Initialize socket connection to server */
    messengerClient.connect(connectionUrl, (data, flags) => {
        helpers.log(`Server message: ${data} : ${flags}`);
    }).then(_socket => {
        helpers.log(`Socket connection to server established`);
        socket = _socket;
    }, onError);
    
    /* Open and initialize output LED to high */
    rpio.open(config.outputPin, rpio.OUTPUT, rpio.HIGH);

    // Motion sensor activity
    motionSensor.on('ready', () => helpers.log('Motion sensor is now ready'));
    motionSensor.on('state', reportActivity);
    motionSensor.on('error', onError);

    // Light sensor activity
    lightSensor.on('state', reportActivity);
    lightSensor.on('error', onError);

    /* Read light sensor initially, the motion sensor takes time
       to boot up and will report when ready */
    lightSensor.readAndEmit();

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
}

function reportActivity(event) {
    helpers.log(`${event.type} reported ${event.state === rpio.HIGH ? 'activity' : 'inactivity'}`);
    socket && socket.send(JSON.stringify({
        source: 'activity-sensor',
        data: event
    }));
    rpio.write(config.outputPin, event.state);
}

function onError(error) {
    console.error(`Error occurred: ${error}`);
}

function cleanup() {
    socket = null;
    rpio.close(config.outputPin);
}

init();