/*jslint node: true */

'use strict';

var log = require('winston');
var async = require('async');
var fs = require('fs');
var torrentStream = require('torrent-stream');
var ffmpeg = require('fluent-ffmpeg');
var Transcoder = require('stream-transcoder');

exports.index = function (req, res, next) {
    var magnet = req.url.replace('/?', '');

    var engine = torrentStream(magnet);

    engine.on('ready', function() {

        async.each(engine.files, function(file, cb) {
            log.info('filename:', file.name);

            var total = file.length;

            // Get the filename
            var movieFileName = file.name;
            
            var contentType = {
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
                res.set('Content-Range',  'bytes ' + start + '-' + end + '/' + total);
                res.set('Accept-Ranges', 'bytes');
                res.set('Content-Length', chunksize);
                res.set('Content-Type', contentType.type);
                // res.openedFile = file;
                var stream = file.createReadStream({
                    start: start,
                    end: end
                });

                if (contentType.convert) {
                    log.info('CONVERT');

                    // new Transcoder(stream)
                    //     .videoCodec('h264')
                    //     .format('mp4')
                    //     .videoBitrate(800 * 1000)
                    //     .on('progress', function (progress) {
                    //         log.info('progress: ', progress.progress);
                    //     })
                    //     .on('finish', function () {
                    //         log.info('finished');
                    //     })
                    //     .stream().pipe(res);

                    ffmpeg(stream)
                        .preset('flashvideo')
                        .on('start', function(commandLine) {
                            log.info('STARTED: ', commandLine);
                        })
                        .on('progress', function(progress) {
                            log.info('PROGRESS: ', progress);
                        })
                        .on('error', function(err) {
                            log.error(err.message);
                        })
                        .on('end', function() {
                            lof.info('Processing finished!');
                        })
                        .pipe(res)
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
}