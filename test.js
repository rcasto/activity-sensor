var rpio = require('rpio');

rpio.open(21, rpio.OUTPUT, rpio.HIGH);

function cleanup() {
    rpio.close(21);
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);