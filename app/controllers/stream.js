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

        var exist = false;
        async.each(engine.files, function (file, cb) {
            var movieFileName = file.name;
            var extension = movieFileName.replace(/.*\./, '');
            var contentType = null;
            switch (extension) {
                case 'ogg':
                    contentType = 'video/ogg';
                    break;
                case 'webm':
                    contentType = 'video/webm';
                    break;
                case 'mp4':
                    contentType = 'video/mp4';
                    break;
            }

            if (!contentType)
                return cb();

            log.info('filename:', file.name);
            var total = file.length;
            exist = true;

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
                res.set('Content-Type', contentType);
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
                res.set('Content-Type', contentType);
                // res.openedFile = file;
                file.createReadStream().pipe(res);
            }
            cb();
        }, function () {
            if (!exist)
                res.status(200).end();
        });
    });

    engine.on('download', function (fragment) {
        console.log('Downloading ' + fragment + ' fragment...');
    });

    engine.on('upload', function (fragment, offset, length) {
        console.log('Uploading ' + fragment + ' fragment...');
    });
};