var linuxRegex = /^lin/;
var logs = [];
var rpioMock = {
    read: (pin) => {
        var value = Math.random() >= 0.5 ? this.HIGH : this.LOW;
        log(`Read ${getVoltageString(value)} from pin ${pin}`);
        return value; 
    },
    write: (pin, voltage) => {
        log(`Wrote ${getVoltageString(voltage)} to pin ${pin}`);
    },
    open: (pin, mode, voltage) => {
        log(`Pin ${pin} open in ${mode} mode with initial voltage ${getVoltageString(voltage)}`);
    },
    close: (pin) => {
        rpioMock.poll(pin, null);
        log(`Pin ${pin} has been closed`);
    },
    pud: (pin, resistor) => {
        log(`Set pullup/pulldown resistor on pin ${pin}: ${resistor}`);
    },
    poll: (pin, handle) => {
        rpioMock.pollHandles[pin] = {
            handle: handle,
            timeoutId: null
        };
        (function pollLoop() {
            log(`Polling pin ${pin}`);
            if (rpioMock.pollHandles[pin].handle) {
                rpioMock.pollHandles[pin].handle();
                rpioMock.pollHandles[pin].timeoutId = setTimeout(pollLoop.bind(this), 5000);
            } else {
                log(`Polling pin ${pin} stopped`);
                clearTimeout(rpioMock.pollHandles[pin].timeoutId);
            }
        }.apply(this));
    },
    pollHandles: {},
    HIGH: 1,
    LOW: 0,
    OUTPUT: 'output',
    INPUT: 'input'
};

function getVoltageString(voltage) {
    return voltage > 0 ? 'HIGH' : 'LOW';
}

function getRpio(platform) {
    return linuxRegex.test(platform) ? require('rpio') : rpioMock;
}

// Only get the time portion of the timestring
function getTimeString(date = new Date()) {
    return date.toTimeString().split(' ')[0];
}

function createTimestamp() {
    var date = new Date();
    var timeString = getTimeString(date);
    var dateString = date.toDateString();
    return `${timeString} - ${dateString}`;
}

function log(msg) {
    msg = `${createTimestamp()}: ${msg}`;
    logs.push(msg);
    console.log(msg);
}

function createLogStream() {
    return logs.join('\n');
}

module.exports = {
    rpioMock,
    getRpio,
    createTimestamp,
    log,
    createLogStream
};