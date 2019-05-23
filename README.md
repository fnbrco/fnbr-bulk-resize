# fnbr-bulk-resize

Service to resize images for `image.fnbr.co` into smaller sizes. Resize requests are sent through Redis on the channel set in the config.  

It will first download the file if not already present locally, then run it through the [sharp](https://npm.im/sharp) library to resize and finally upload all of the newly resized images to S3.
