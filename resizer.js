'use strict';

var rfr = require('rfr');
var logger = rfr('lib/logger');

var async = require('async');
var fs = require('fs');
var sharp = require('sharp');
var path = require('path');
var axios = require('axios');

class Resizer {

    constructor() {
        // Resolutions images will be resized at
        this.resolutions = {
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

        var AWS = require('aws-sdk');
        this.s3 = new AWS.S3(config.amazon.s3);
    }

    startup() {
    }

    // item = object from mongo
    // inputType = either 'featured' or 'icon'
    resize(item, inputType) {
        return new Promise(async (resolve,  reject) => {
            var localFileName = item._id.toString() + '_' + inputType + '.png';
            var localPath = path.join(config.folders.downloads, localFileName);
            if(!fs.existsSync(localPath)) {
                try {
                    logger.debug('Downloading from CDN: ' + localFileName);
                    await this.fetchFromCDN(item.images[inputType], localFileName);
                } catch(awaitEr) {
                    logger.error('Error from fetch');
                    logger.error(awaitEr);
                    return reject({status: 500, error: 'Internal Error', errorMessage: 'Fetch failed for ' + item.name + ' (' + item._id + ')'});
                }
            }

            logger.debug(item.name + ' exists in folder, resizing into ' + Object.keys(this.resolutions));

            async.eachOfLimit(Object.keys(this.resolutions), 1, (resolutionKey, resolutionIndex, nextResolution) => {
                if(!resolutionKey) {
                    return nextResolution();
                }

                if(this.resolutions.hasOwnProperty(resolutionKey)) {
                    var sizeString = this.resolutions[resolutionKey].split('x');

                    if(sizeString.length != 2) {
                        return reject({status: 400, error: 'Bad Request', errorMessage: 'Malformed size ' + this.resolutions[resolutionKey] + ' (' + resolutionKey + ' ' + sizeString.length + ')'});
                    }

                    try {
                        var width = parseInt(sizeString[0]);
                        var height = parseInt(sizeString[1]);

                        var targetFileName = localFileName.split('.')[0] + '_' + resolutionKey + '.' + localFileName.split('.')[1];
                        var targetPath = path.join(config.folders.mutations, targetFileName);

                        logger.debug('Mutating ' + localFileName + ' to ' + width + 'x' + height + ' becoming ' + targetFileName);

                        var sharpEvent = sharp(localPath).resize(width, height).png();

                        sharpEvent.toFile(targetPath).then((info) => {
                            this.uploadToCDN(targetPath, item, inputType, resolutionKey).then(() => {
                                return nextResolution();
                            }).catch((uploadE) => reject(uploadE));
                        }).catch((sharpErr) => {
                            return reject(sharpErr);
                        });
                    } catch(er) {
                        logger.error(er);
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

    fetchFromCDN(remotePath, localFileName) {
        return new Promise((resolve, reject) => {
            var localPath = path.join(config.folders.downloads, localFileName);
            var targetStream = fs.createWriteStream(localPath);

            logger.debug('[DL] ' + remotePath + ' -> ' + localPath);

            console.log(typeof remotePath)
            axios({
                url: remotePath,
                method: 'get',
                responseType: 'stream'
            }).then((response) => {
                response.data.on('end', () => {
                    return resolve();
                }).on('error', (err) => {
                    return reject(err);
                }).pipe(targetStream);
            });
        });
    }

    uploadToCDN(localFile, item, inputType, targetSize) {
        return new Promise((resolve, reject) => {
            // Because we already write the conversion to file, we cannot then use a buffer
            // So we have to read from disk to upload to S3
            if(fs.existsSync(localFile)) {
                var targetPath = item.type + '/' + item._id + '/' + inputType + '_' + targetSize + '.png';
                logger.debug('Uploading ' + item.name + ' as "' + targetPath + '" after resize to ' + targetSize);

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
