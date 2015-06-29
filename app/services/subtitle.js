/*jslint node: true */

'use strict';

var provider = require('./provider');
var async = require('async');
var request = require('request');
var fs = require('fs');
var AdmZip = require('adm-zip');
var path = require('path');
var log = require('winston');
var srt2vtt = require('srt2vtt');

exports.get = function (imdb_code, cb) {
    var that = this;
    request
        .get({
            url: provider.subtitles().url + '/' + imdb_code,
            json: true
        }, function (err, response, body) {
            if (!err && response.statusCode === 200 && !!body && body.success && body.subtitles > 0) {
                var subtitles = body.subs[imdb_code];
                cb(null, subtitles);
                that.download(subtitles, imdb_code);
            }

            request
                .get({
                    url: provider.subtitles().mirrorUrl + '/' + imdb_code,
                    json: true
                }, function (err, response, body) {
                    if (err || response.statusCode >= 400 || !body || !body.success) {
                        return cb(err);
                    }

                    var subtitles = body.subtitles > 0 ? body.subs[imdb_code] : [];
                    cb(null, subtitles);
                    that.download(subtitles, imdb_code);
                });
        });
}

exports.download = function (subtitles, imdb_code) {
    if (!subtitles)
        return

    console.log('PASSSOOOOUUUUU ============')

    var moviePath = path.resolve(__dirname, '..', 'public/subtitles/' + imdb_code) + '/';
    if (!fs.existsSync(moviePath)) {
        fs.mkdirSync(moviePath);

        var zipPath = moviePath + 'zip/';
        if (!fs.existsSync(zipPath)) {
            fs.mkdirSync(zipPath);
        }

        var srtPath = moviePath + 'srt/';
        if (!fs.existsSync(srtPath)) {
            fs.mkdirSync(srtPath);
        }

        var vttPath = moviePath + 'vtt/';
        if (!fs.existsSync(vttPath)) {
            fs.mkdirSync(vttPath);
        }

        async.each(subtitles, function (language, cb) {
            var subtitle = language.sort(function (a, b) { return a.rating < b.rating })[0];
            var url = provider.subtitles().prefix + subtitle.url;
            var extension = url.replace(/.*\./, '');
            
            switch (extension) {
                case 'zip':
                    _downloadZip(zipPath, srtPath, vttPath, url);
                    break;
                case 'srt':
                    _downloadSrt(srtPath, vttPath, url);
                    break;
                case 'vtt':
                    _downloadVtt(vttPath, url);
                    break;
            }

            cb();
            
        });
    }
}

var _downloadZip = function (zipPath, srtPath, vttPath, url) {
    var filename = zipPath + url.replace(/.*\//, '');
    var out = fs.createWriteStream(filename);
    request(url)
        .on('end', function () {
            out.end(function () {
                try {
                    var zip = new AdmZip(filename);
                    zip.extractAllTo(srtPath, true);
                    var zipEntries = zip.getEntries();
                    async.each(zipEntries, function (entry, cbEntry) {
                        if (entry.entryName.indexOf('.srt') === -1)
                            return cbEntry();

                        var entryPath = srtPath + entry.entryName
                        var newName = path.join(srtPath, filename.replace(/.*\//, '').replace('.zip', '.srt'));
                        fs.renameSync(entryPath, newName);
                        _convertSrtToVtt(vttPath, newName);
                        cbEntry();
                    });
                } catch (err) {
                    log.error('Error unzip subtitle: ', filename);
                }
            });
        })
        .pipe(out);
}

var _downloadSrt = function (srtPath, vttPath, url) {
    var filename = srtPath + url.replace(/.*\//, '');
    var out = fs.createWriteStream(filename);
    request(url)
        .on('end', function () {
            out.end(function () {
                try {
                    _convertSrtToVtt(vttPath, filename);
                } catch (err) {
                    log.error('Error unzip subtitle: ', filename);
                }
            });
        })
        .pipe(out);
}

var _downloadVtt = function (vttPath, url) {
    var filename = vttPath + url.replace(/.*\//, '');
    var out = fs.createWriteStream(filename);
    request(url).pipe(out);
}

var _convertSrtToVtt = function (vttPath, filename) {
    var srtData = fs.readFileSync(filename);
    srt2vtt(srtData, function(err, vttData) {
        if (err)
            return log.error(err);

        var file = filename.replace(/.*\//, '');
        var vttFile = vttPath + file.replace('.srt', '.vtt');
        fs.writeFileSync(vttFile, vttData);
    });
}