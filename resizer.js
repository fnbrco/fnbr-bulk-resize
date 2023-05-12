'use strict';

const rfr = require('rfr');
const logger = rfr('lib/logger');

const async = require('async');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');
const fetch = require('node-fetch');
const AWS = require('aws-sdk');

class Resizer {

    constructor() {
        // Resolutions images will be resized at
        this.resolutions = {
            '512' : '512x512',
            '320' : '320x320',
            '256' : '256x256',
            '192' : '192x192',
            '128' : '128x128'
        };

        if(!fs.existsSync(config.folders.downloads)) {
            fs.mkdirSync(config.folders.downloads);
        }

        if(!fs.existsSync(config.folders.mutations)) {
            fs.mkdirSync(config.folders.mutations);
        }

        // If there is a custom S3-compatible endpoint defined, use it.
        if(config.amazon.s3.endpoint) {
            config.amazon.s3.endpoint = new AWS.Endpoint(config.amazon.s3.endpoint);
        }

        this.s3 = new AWS.S3(config.amazon.s3);
    }

    startup() {
        // If wishing to resize lots of images (for example) directly from database,
        // add code here which will run at startup
    }

    // item = object from mongo
    // inputType = either 'featured' or 'icon'
    resize(item, inputType) {
        return new Promise(async (resolve,  reject) => {
            let timestamp = new Date().getTime();
            let localFileName = item._id.toString() + '_' + inputType + '_' + timestamp + '.png';
            let localPath = path.join(config.folders.downloads, localFileName);

            try {
                logger.debug('Downloading from CDN: ' + localFileName);
                await this.fetchFromCDN(item.images[inputType], localFileName);
            } catch(awaitEr) {
                logger.error('Error from fetch for ' + item.name + '(' + item._id + ')');
                logger.error(awaitEr);
                return reject({status: 500, error: 'Internal Error', errorMessage: 'Fetch failed for ' + item.name + ' (' + item._id + ')'});
            }

            // Work through each resolution available one at a time
            async.eachOfLimit(Object.keys(this.resolutions), 1, (resolutionKey, resolutionIndex, nextResolution) => {
                if(!resolutionKey) {
                    return nextResolution();
                }

                // Only allow 512x512 resolution for featured (as they start at 1024x1024)
                if(resolutionKey == '512' && inputType != 'featured') {
                    return nextResolution();
                }

                if(this.resolutions.hasOwnProperty(resolutionKey)) {
                    let sizeString = this.resolutions[resolutionKey].split('x');

                    if(sizeString.length != 2) {
                        return reject({status: 400, error: 'Bad Request', errorMessage: 'Malformed size ' + this.resolutions[resolutionKey] + ' (' + resolutionKey + ' ' + sizeString.length + ')'});
                    }

                    try {
                        let width = parseInt(sizeString[0]);
                        let height = parseInt(sizeString[1]);

                        let targetFileName = localFileName.split('.')[0] + '_' + resolutionKey + '.' + localFileName.split('.')[1];
                        let targetPath = path.join(config.folders.mutations, targetFileName);

                        logger.debug('Mutating ' + localFileName + ' to ' + width + 'x' + height + ' becoming ' + targetFileName);

                        let sharpEvent = sharp(localPath).resize(width, height).png();

                        // Save mutated file to disk
                        sharpEvent.toFile(targetPath).then((info) => {
                            // Upload mutated file to S3-compatible API
                            if(config.amazon.s3.accessKeyId && config.amazon.s3.secretAccessKey != '---') {
                                this.uploadToCDN(targetPath, item, inputType, resolutionKey).then(() => {
                                    return nextResolution();
                                }).catch((uploadE) => reject(uploadE));
                            } else {
                                logger.debug('Not uploading to S3 API: credentials not configured');
                                return nextResolution();
                            }
                        }).catch((sharpErr) => reject(sharpErr));
                    } catch(er) {
                        return reject(er);
                    }
                } else {
                    return reject({status: 400, error: 'Bad Request', errorMessage: 'Size not found ' + resolutionKey});
                }
            }, () => {
                logger.info('All resolutions complete (' + item.name + ', ' + inputType + ')');
                return resolve();
            });
        });
    }

    /*
     * Download a file from CDN to local disk
     */
    fetchFromCDN(remotePath, localFileName) {
        return new Promise((resolve, reject) => {
            let localPath = path.join(config.folders.downloads, localFileName);
            let targetStream = fs.createWriteStream(localPath);

            logger.debug('[DL] ' + remotePath + ' -> ' + localPath);

            fetch(remotePath).then((response) => {
                response.body.on('end', () => resolve());
                response.body.pipe(targetStream);
            }).catch((e) => reject(e));
        });
    }

    /*
     * Upload a mutated file back to CDN
     */
    uploadToCDN(localFile, item, inputType, targetSize) {
        return new Promise((resolve, reject) => {
            // Because we already write the conversion to file, we cannot then use a buffer
            // So we have to read from disk to upload to S3
            if(fs.existsSync(localFile)) {
                let targetPath = item.type + '/' + item._id + '/' + inputType + '_' + targetSize + '.png';
                logger.debug('Uploading ' + item.name + ' as "' + targetPath + '" after resize to ' + targetSize);

                // File will be read sync
                let binary = fs.readFileSync(localFile, null);

                this.s3.putObject({
                    Body: binary,
                    Bucket: config.amazon.s3.bucket,
                    ContentType: 'image/png',
                    Key: targetPath,
                    ACL: 'public-read'
                }, (uploadErr, uploadData) => {
                    if(uploadErr) {
                        return reject(uploadErr);
                    }

                    return resolve();
                });
            } else {
                return reject('file not found ' + localFile);
            }
        });

    }

}

module.exports = new Resizer();
