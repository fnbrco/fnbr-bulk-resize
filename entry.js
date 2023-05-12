'use strict';

const rfr = require('rfr');
const fs = require('fs');

const logger = rfr('lib/logger');

logger.info('Starting application...');

rfr('lib/config-wrapper').read();

if(typeof global.config == 'undefined') {
    return;
}

const connections = {
    MongoDB: false,
    Redis: false
};

rfr('lib/redis');

Redis.on('connected', () => {
    logger.debug('Connected to Redis');
    connections.Redis = true;

    rfr('lib/mongo');

    MongoDB.on('connected', () => {
        logger.debug('Connected to MongoDB');
        connections.MongoDB = true;

        rfr('resizer').startup();

        if(config.healthcheck && config.healthcheck.enable) {
            rfr('web');
        } else {
            logger.warn('Not enabling http healthcheck');
        }
    });
});

setTimeout(() => {
    if(!connections.MongoDB || !connections.Redis) {
        logger.error('Connection timeout for databases. Quitting..');

        global.Redis = false;
        global.MongoDB = false;

        setTimeout(() => process.exit(1), 150);
    }
}, 5000);
