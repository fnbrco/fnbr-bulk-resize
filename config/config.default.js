const path = require('path');
const config = {};

config.folders = {
    downloads: path.join(process.cwd(), '/downloads'),
    mutations: path.join(process.cwd(), '/mutations')
};

config.healthcheck = {
    port: 4040,
    enable: true
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

        // Define 'endpoint' to use a S3-compatible api - such as DigitalOcean spaces:
        // endpoint: 'nyc3.digitaloceanspaces.com'

        // Or Cloudflare R2: (region should be auto)
        // endpoint: 'https://[your-bucket-id].r2.cloudflarestorage.com',
        // signatureVersion: 'v4'
    }
};

config.items = {
    mongoCollection: 'Items',
    // Which items to ignore when a resize is requested
    ignore: {
        // A list of item types
        type: ['lego_outfit'],
        // A list of item rarities in their integer/power form
        rarity: []
    }
};

module.exports = config;
