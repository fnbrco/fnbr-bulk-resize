var config = {};
var path = require('path');

config.folders = {
    downloads: path.join(process.cwd(), '/downloads'),
    mutations: path.join(process.cwd(), '/mutations')
};

config.channel = 'item_updates';

config.redis = {
    password: '',
    host: 'localhost',
    port: 6379,
    db: 0
};

config.mongo = {
    database: 'fnbr',
    host: 'localhost',
    port: 27017,
    username: false,
    password: false
};

config.amazon = {
    s3: {
        accessKeyId: '--',
        secretAccessKey: '---',
        region: 'us-east-2',
        bucket: 'image.fnbr.co'
    }
};

module.exports = config;
