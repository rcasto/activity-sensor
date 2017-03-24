var config = require('./config');
var motionSensor = require('./motionSensor')(config.motionSensorPin);
var helpers = require('./helpers');
var rpio = helpers.getRpio();

motionSensor.on('state', (state) => {
    console.log(state);
});
motionSensor.on('error', (err) => console.error(err));