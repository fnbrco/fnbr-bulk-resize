// Just a simple prefix logger, no need for writing to files
module.exports = {
    info: (message) => {
        console.log('[INFO]  ', message);
    },
    error: (message) => {
        console.error('[ERROR] ', message);
    },
    warn: (message) => {
        console.warn('[WARN]  ', message);
    },
    debug: (message) => {
        console.log('[DEBUG] ', message);
    }
};
