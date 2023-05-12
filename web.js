const http = require('http');
const rfr = require('rfr');
const logger = rfr('lib/logger');

const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'text/plain');
    res.end('alive');
});

server.listen(config.healthcheck.port, (err) => {
    if(err) {
        logger.error(err);
        logger.error('Could not start healthcheck on port ' + config.healthcheck.port);
    } else {
        logger.info('Started healthcheck at *:' + config.healthcheck.port);
    }
});

