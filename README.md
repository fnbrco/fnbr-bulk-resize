# fnbr-bulk-resize

Service to resize images for `image.fnbr.co` into smaller sizes. Resize requests are sent through Redis on the channel set in the config.  

It will first download the file if not already present locally, then run it through the [sharp](https://npm.im/sharp) library to resize and finally upload all of the newly resized images to S3.

## S3 Compatibility

By default the config will be expecting credentials for [Amazon S3](https://aws.amazon.com/s3/) but it also supports a provider with an S3-compatible API, such as [DigitalOcean Spaces](https://docs.digitalocean.com/products/spaces/).  

To use an alternative provider define the `endpoint` field, see [config/config.default.js](https://github.com/fnbrco/fnbr-bulk-resize/blob/master/config/config.default.js#L32-L33) for an example.  
