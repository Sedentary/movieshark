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
var openSRT = require('popcorn-opensubtitles');

exports.getMovieSubs = function (imdb_code, cb) {
    request
        .get({
            url: provider.subtitles().url + '/' + imdb_code,
            json: true
        }, function (err, response, body) {
            if (!err && response.statusCode === 200 && !!body && body.success && body.subtitles > 0) {
                var subtitles = body.subs[imdb_code];
                cb(null, subtitles);
                _download(subtitles, imdb_code);
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
                    _download(subtitles, imdb_code);
                });
        });
};

/**
 *
 * @param {object} query {
 *  moviehash,
 *  imdbid,
 *  season,
 *  episode,
 *  tag
 * }
 * @param cb
 */
exports.getSerieSubs = function (query, cb) {
    var userAgent = 'Popcorn Time v1';
    openSRT.searchEpisode(query, userAgent).then(function (subtitles) {
        for (var lang in subtitles) {
            subtitles[lang] = subtitles[lang].url;
        }
        cb(null, subtitles);
        _download(subtitles, query.imdbid);
    });
};

var _download = function (subtitles, imdb_code) {
    if (!subtitles)
        return;

    var moviePath = path.resolve(__dirname, '..', 'public/subtitles/' + imdb_code) + '/';
    if (!fs.existsSync(moviePath)) {
        fs.mkdirSync(moviePath);

        var zipPath = path.normalize(moviePath + 'zip/');
        if (!fs.existsSync(zipPath)) {
            fs.mkdirSync(zipPath);
        }

        var srtPath = path.normalize(moviePath + 'srt/');
        if (!fs.existsSync(srtPath)) {
            fs.mkdirSync(srtPath);
        }

        var vttPath = path.normalize(moviePath + 'vtt/');
        if (!fs.existsSync(vttPath)) {
            fs.mkdirSync(vttPath);
        }

        async.each(subtitles, function (language, cb) {
            var subtitle;
            if (typeof language !== 'string') {
                subtitle = language.sort(function (a, b) {
                    return a.rating < b.rating;
                })[0];
            }

            var url = subtitle ? provider.subtitles().prefix + subtitle.url : language;
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
};

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

                        var entryPath = srtPath + entry.entryName;
                        var newName = path.join(srtPath, filename.replace(/.*\//, '').replace('.zip', '.srt'));
                        fs.renameSync(entryPath, newName);
                        _convertSrtToVtt(vttPath, newName);
                        cbEntry();
                    });
                } catch (err) {
                    log.error('Error unzipping subtitle: ', filename);
                }
            });
        })
        .pipe(out);
};

var _downloadSrt = function (srtPath, vttPath, url) {
    var filename = srtPath + url.replace(/.*\//, '');
    var out = fs.createWriteStream(filename);
    request(url)
        .on('end', function () {
            out.end(function () {
                try {
                    _convertSrtToVtt(vttPath, filename);
                } catch (err) {
                    log.error('Error converting subtitle: ', filename);
                }
            });
        })
        .pipe(out);
};

var _downloadVtt = function (vttPath, url) {
    var filename = vttPath + url.replace(/.*\//, '');
    var out = fs.createWriteStream(filename);
    request(url).pipe(out);
};

var _convertSrtToVtt = function (vttPath, filename) {
    var srtData = fs.readFileSync(filename);
    srt2vtt(srtData, function (err, vttData) {
        if (err)
            return log.error(err);

        var file = filename.replace(/.*\//, '');
        var vttFile = vttPath + file.replace('.srt', '.vtt');
        fs.writeFileSync(vttFile, vttData);
    });
};
