// Just a simple prefix logger, no need for writing to files
module.exports = {
    datePrefix: (date) => {
        date = date ? date : new Date();
        return `[${date.toISOString()}] `;
    },
    info: (message) => {
        console.log(module.exports.datePrefix() + ' \x1b[32m[INFO]\x1b[0m', message);
    },
    error: (message) => {
        console.error(module.exports.datePrefix() + '\x1b[31m[ERROR]\x1b[0m', message);
    },
    warn: (message) => {
        console.warn(module.exports.datePrefix() + ' \x1b[33m[WARN]\x1b[0m', message);
    },
    debug: (message) => {
        console.log(module.exports.datePrefix() + '\x1b[36m[DEBUG]\x1b[0m', message);
    }
};
