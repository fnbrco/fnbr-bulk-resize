var rfr = require('rfr');
var logger = rfr('lib/logger');

module.exports.read = () => {
    logger.debug('Checking for config');

    try {
        global.config = require(process.cwd() + '/config/config.js');
        logger.debug('Found config.js!');
    } catch(ex) {
        if(ex.code == 'MODULE_NOT_FOUND') {
            /* eslint-disable */
            console.error(' ');
            logger.error('No config.js file found. For defaults see config/config.default.js');
            console.error(' ');
            console.trace(ex.message);
            /* eslint-enable */
            return setTimeout(() => process.exit(1), 150);
        }

        logger.debug('Unable to read config.js - ' + ex.code);

        throw ex;
    }
};
