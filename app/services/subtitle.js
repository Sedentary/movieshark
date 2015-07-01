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
                _downloadMovieSubs(subtitles, imdb_code);
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
                    _downloadMovieSubs(subtitles, imdb_code);
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
        var subs = {};
        for (var lang in subtitles) {
            var language = _languageMapping[lang];
            subs[language] = subtitles[lang].url
        }
        cb(null, subs);
        _downloadSerieSubs(subs, query.imdbid, query.season, query.episode);
    });
};

var _downloadSerieSubs = function (subtitles, imdb_code, season, episode) {
    if (!subtitles)
        return;

    var seriePath = path.normalize(path.resolve(__dirname, '..', 'public/subtitles/' + imdb_code) + '/');
    var seasonPath = path.normalize(seriePath + season + '/');
    var episodePath = path.normalize(seasonPath + episode + '/');

    if (!fs.existsSync(episodePath)) {
        
        if (!fs.existsSync(seriePath))
            fs.mkdirSync(seriePath);

        if (!fs.existsSync(seasonPath))
            fs.mkdirSync(seasonPath);

        fs.mkdirSync(episodePath);

        var srtPath = path.normalize(episodePath + 'srt/');
        if (!fs.existsSync(srtPath)) {
            fs.mkdirSync(srtPath);
        }

        var vttPath = path.normalize(episodePath + 'vtt/');
        if (!fs.existsSync(vttPath)) {
            fs.mkdirSync(vttPath);
        }

        async.each(subtitles, function (language, cb) {
            _downloadSrt(srtPath, vttPath, language);

            cb();
        });
    }
};

var _downloadMovieSubs = function (subtitles, imdb_code) {
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
            var subtitle = language.sort(function (a, b) {
                return a.rating < b.rating;
            })[0];

            var url = provider.subtitles().prefix + subtitle.url;
            var extension = path.basename(url);

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
    var filename = zipPath + path.basename(url);
    var out = fs.createWriteStream(filename);
    request(url)
        .on('end', function () {
            out.end(function () {
                try {
                    var zip = new AdmZip(filename);
                    zip.extractAllTo(srtPath, true);
                    var zipEntries = zip.getEntries();
                    async.each(zipEntries, function (entry, cbEntry) {
                        if (path.extname(entry.entryName) === '.srt')
                            return cbEntry();

                        var entryPath = srtPath + entry.entryName;
                        var newName = path.join(srtPath, path.base(filename).replace('.zip', '.srt'));
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
    var filename = srtPath + path.basename(url);
    var out = fs.createWriteStream(filename);
    request(url)
        .on('end', function () {
            out.end(function () {
                try {
                    _convertSrtToVtt(vttPath, filename);
                } catch (err) {
                    console.log(err);
                    log.error('Error converting subtitle: ', filename);
                }
            });
        })
        .pipe(out);
};

var _downloadVtt = function (vttPath, url) {
    var filename = vttPath + path.basename(url);
    var out = fs.createWriteStream(filename);
    request(url).pipe(out);
};

var _convertSrtToVtt = function (vttPath, filename) {
    var srtData = fs.readFileSync(filename);
    srt2vtt(srtData, function (err, vttData) {
        if (err)
            return log.error(err);

        var file = path.basename(filename);
        var vttFile = vttPath + file.replace('.srt', '.vtt');
        fs.writeFileSync(vttFile, vttData);
    });
};

var _languageMapping = {
    'sq' : 'albanian',
    'ar' : 'arabic',
    'bn' : 'bengali',
    'pt-br' : 'brazilian-portuguese',
    'bg' : 'bulgarian',
    'bs' : 'bosnian',
    'zh' : 'chinese',
    'hr' : 'croatian',
    'cs' : 'czech',
    'da' : 'danish',
    'nl' : 'dutch',
    'en' : 'english',
    'et' : 'estonian',
    'fa' : 'farsi-persian',
    'fi' : 'finnish',
    'fr' : 'french',
    'de' : 'german',
    'el' : 'greek',
    'he' : 'hebrew',
    'hu' : 'hungarian',
    'id' : 'indonesian',
    'it' : 'italian',
    'ja' : 'japanese',
    'ko' : 'korean',
    'lt' : 'lithuanian',
    'mk' : 'macedonian',
    'ms' : 'malay',
    'no' : 'norwegian',
    'pl' : 'polish',
    'pt' : 'portuguese',
    'ro' : 'romanian',
    'ru' : 'russian',
    'sr' : 'serbian',
    'sl' : 'slovenian',
    'es' : 'spanish',
    'sv' : 'swedish',
    'th' : 'thai',
    'tr' : 'turkish',
    'ur' : 'urdu',
    'uk' : 'ukrainian',
    'vi' : 'vietnamese',
};