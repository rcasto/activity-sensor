function timeoutPromise(timeInMs, shouldResolve = true) {
    var timeoutId = null;
    var promise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
            timeoutId = null;
            shouldResolve ? resolve() : reject();
        }, timeInMs);
    });
    promise.cancel = () => clearTimeout(timeoutId);
    return promise;
}

module.exports = timeoutPromise;