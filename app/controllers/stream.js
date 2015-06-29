/*jslint node: true */

'use strict';

var log = require('winston');
var async = require('async');
var fs = require('fs');
var torrentStream = require('torrent-stream');
var torrent = require('../services/torrent');

exports.index = function (req, res) {
    var magnet = req.url.replace('/?', '');
    
    var engine = torrentStream(magnet);

    engine.on('ready', function () {

        var file = engine.files[0];
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

        if (!contentType) {
            engine.destroy();
            return res.status(200).end();
        }

        log.info('filename:', file.name);
        var total = file.length;

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

            var stream = file.createReadStream({
                start: start,
                end: end
            });

            stream.pipe(res);
        } else {
            res.status(200);
            res.set('Content-Length', total);
            res.set('Content-Type', contentType);
            file.createReadStream().pipe(res);
        }

        res.on('close', function () {
            engine.destroy();
            log.info('Engine destroy');
        });

        res.on('finish', function () {
            engine.destroy();
            log.info('Engine destroy');
        });

    });

};