'use strict';

const rfr = require('rfr');
const EventEmitter = require('events');
const logger = rfr('lib/logger');

class MongoDB extends EventEmitter {

    constructor() {
        super();

        this.objId = require('mongodb').ObjectId;
        this.db = new Promise((resolve, reject) => {
            require('mongodb').connect('mongodb://' + (config.mongo.username && config.mongo.password ? config.mongo.username + ':' + config.mongo.password + '@' : '') + config.mongo.host + ':' + config.mongo.port + '/' + config.mongo.database, {
                reconnectTries: 25,
                reconnectInterval: 750,
                useNewUrlParser: true,
                useUnifiedTopology: true
            }, (err, db) => {
                if(err) {
                    throw err;
                } else {
                    clearTimeout(global.dbInterval);
                    this.db = db.db(this.databaseName);
                    this.emit('connected');

                    return resolve(this.db);
                }
            });
        });
    }

    bindEvents() {
        this.db.on('close', () => {
            logger.debug('Disconnected from MongoDB');
            this.emit('disconnected');
        });

        this.db.on('reconnect', (e) => {
            logger.debug('Reconnected to MongoDB');
            clearTimeout(global.dbInterval);
        });
    }

    get(collection) {
        return this.db.collection(collection);
    }

    isValid(str) {
        return this.objId.isValid(str);
    }

}

global.MongoDB = new MongoDB();
