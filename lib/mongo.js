'use strict';

var rfr = require('rfr');
var EventEmitter = require('events');
var logger = rfr('lib/logger');

class MongoDB extends EventEmitter {
    constructor() {
        super();
        var self = this;
        this.objId = require('mongodb').ObjectId;
        this.db = new Promise((resolve, reject) => {
            require('mongodb').connect('mongodb://' + (config.mongo.username && config.mongo.password ? config.mongo.username + ':' + config.mongo.password + '@' : '') + config.mongo.host + ':' + config.mongo.port + '/' + config.mongo.database, {
                reconnectTries: 25,
                reconnectInterval: 750,
                useNewUrlParser: true
            }, (err, db) => {
                if(err) {
                    throw err;
                } else {
                    clearTimeout(global.dbInterval);
                    this.db = db.db(config.mongo.database);
                    self.emit('connected');
                    return resolve(this.db);
                }
            });
        });
    }

    bindEvents() {
        var self = this;

        self.db.on('reconnect', (e) => {
            logger.debug('Reconnected to MongoDB');
            clearTimeout(global.dbInterval);
        });

        self.db.on('close', () => {
            logger.debug('Disconnected from MongoDB');
            self.emit('disconnected');
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
