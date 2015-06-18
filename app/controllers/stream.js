/*jslint node: true */

'use strict';

var fs = require('fs');
var torrentStream = require('torrent-stream')

exports.index = function (req, res, next) {
    var magnet = req.url.replace('/?', '');

    var engine = torrentStream(magnet);

    engine.on('ready', function() {
        engine.files.forEach(function(file) {
            console.log('filename:', file.name);

            var total = file.length;

            // Get the filename
            var movieFileName = file.name;
            
            var contentType = "video/mp4";
            if (movieFileName.indexOf('.ogg') !== -1) {
                contentType = "video/ogg";
            } else if (movieFileName.indexOf('.webm') !== -1) {
                contentType = "video/webm";
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
                console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

                res.status(206);
                res.set('Content-Range',  'bytes ' + start + '-' + end + '/' + total);
                res.set('Accept-Ranges', 'bytes');
                res.set('Content-Length', chunksize);
                res.set('Content-Type', contentType);
                res.openedFile = file;
                var stream = file.createReadStream({
                    start: start,
                    end: end
                });
                stream.pipe(res);
            } else {
                console.log('ALL: ' + total);
                res.status(200);
                res.set('Content-Length', total);
                res.set('Content-Type', contentType);
                res.openedFile = file;
                file.createReadStream().pipe(res);
            }
        });
    });
}