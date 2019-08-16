'use strict';

var rfr = require('rfr');
var EventEmitter = require('events');
var logger = rfr('lib/logger');
var IORedis = require('ioredis');
var resizer = rfr('resizer');

class Redis extends EventEmitter {

    constructor() {
        super();
        logger.debug('Connecting to Redis..');

        this.instance = new IORedis(config.redis);

        this.instance.on('connect', () => {
            this.emit('connected');
        });

        this.subscriber = new IORedis(config.redis);

        this.subscriber.on('connect', () => {
            this.subscriber.subscribe(config.channel).then((err) => {
                logger.debug('Subscribed to ' + config.channel + ' redis events [' + err + ']');
            });
        });

        this.subscriber.on('message', (channel, message) => {
            if(channel == config.channel) {
                try {
                    var json = JSON.parse(message);
                } catch(e) {
                    logger.debug('[REDIS] Ignoring message, not valid JSON');
                    logger.debug(e);
                    return;
                }

                if(json.event == 'new-upload') {
                    logger.info('[REDIS] New image through redis ' + json.item);

                    MongoDB.get('Items').findOne({ _id: new MongoDB.objId(json.item) }, (err, item) => {
                        logger.info('[REDIS] Resizing and uploading ' + item.name + ' (' + json.item + ')');

                        resizer.resize(item, json.uploadType).then(() => {
                            logger.info('[REDIS] Done ' + json.item);

                            // Resize is complete so update database
                            MongoDB.get('Items').updateOne({_id: item._id}, {'$set' : {'images.resizeAvailable' : true}}, (errr) => console.error(errr));
                            this.use().del('fnbr_items:' + item._id);
                            this.use().del('fnbr_items:' + item.type + ':' + item.slug);
                        }).catch((rerr) => {
                            // If any of the resizes fail, fallback to disabling it completely
                            MongoDB.get('Items').updateOne({_id: item._id}, {'$set' : {'images.resizeAvailable' : false}}, (errr) => console.error(errr));
                            this.use().del('fnbr_items:' + item._id);
                            this.use().del('fnbr_items:' + item.type + ':' + item.slug);

                            logger.error('Unable to resize ' + item.name);
                            console.error(rerr);
                        });
                    });
                }
            }
        });
    }

    use() {
        return this.instance;
    }

    publish(channel, data) {
        if(typeof data == 'object') {
            data = JSON.stringify(data);
        }

        this.instance.publish(channel, data);
    }
}

global.Redis = new Redis();
