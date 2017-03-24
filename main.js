var motionSensor = require('./motionSensor')();
var config = require('./config');

motionSensor.on('state', (state) => {
    console.log(state);
});
motionSensor.on('error', (err) => console.error(err));