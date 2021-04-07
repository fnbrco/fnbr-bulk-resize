// Just a simple prefix logger, no need for writing to files
module.exports = {
    datePrefix: (date) => {
        date = date ? date : new Date();
        return `[${date.toISOString()}] `;
    },
    info: (message) => {
        console.log(module.exports.datePrefix() + ' [INFO]', message);
    },
    error: (message) => {
        console.error(module.exports.datePrefix() + '[ERROR]', message);
    },
    warn: (message) => {
        console.warn(module.exports.datePrefix() + ' [WARN]', message);
    },
    debug: (message) => {
        console.log(module.exports.datePrefix() + '[DEBUG]', message);
    }
};
