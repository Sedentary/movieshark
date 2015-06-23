/*jslint node: true */

'use strict';

var log = require('winston');
var async = require('async');
var fs = require('fs');
var torrentStream = require('torrent-stream');

exports.index = function (req, res) {
    var magnet = req.url.replace('/?', ''),
        engine = torrentStream(magnet);

    engine.on('ready', function () {

        async.each(engine.files, function (file, cb) {
            log.info('filename:', file.name);

            var total = file.length,
            // Get the filename
                movieFileName = file.name,
                contentType = {
                    type: 'video/mp4',
                    convert: false
                };

            if (movieFileName.indexOf('.ogg') !== -1) {
                contentType.type = 'video/ogg';
            } else if (movieFileName.indexOf('.webm') !== -1) {
                contentType.type = 'video/webm';
            } else if (movieFileName.indexOf('.avi') !== -1) {
                contentType.convert = true;
            }

            // Chunks based streaming
            if (req.headers.range) {
                var range = req.headers.range;
                var parts = range.replace(/bytes=/, "").split("-");
                var partialstart = parts[0];
                var partialend = parts[1];

                var start = parseInt(partialstart, 10);
                var end = partialend ? parseInt(partialend, 10) : total - 1;
                var chunksize = (end - start) + 1;

                res.status(206);
                res.set('Content-Range', 'bytes ' + start + '-' + end + '/' + total);
                res.set('Accept-Ranges', 'bytes');
                res.set('Content-Length', chunksize);
                res.set('Content-Type', contentType.type);
                // res.openedFile = file;
                var stream = file.createReadStream({
                    start: start,
                    end: end
                });

                if (contentType.convert) {
                    //TODO show error
                } else {
                    stream.pipe(res);
                }
            } else {
                res.status(200);
                res.set('Content-Length', total);
                res.set('Content-Type', contentType.type);
                // res.openedFile = file;
                file.createReadStream().pipe(res);
            }
            cb();
        });
    });

    engine.on('download', function (fragment) {
        console.log('Downloading ' + fragment + ' fragment...');
    });

    engine.on('upload', function (fragment, offset, length) {
        console.log('Uploading ' + fragment + ' fragment...');
    });
};