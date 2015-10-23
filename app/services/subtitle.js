/*jslint node: true */

'use strict';

const provider = require('./provider');
const async = require('async');
const request = require('request');
const fs = require('fs');
const AdmZip = require('adm-zip');
const path = require('path');
const log = require('winston');
const srt2vtt = require('srt2vtt');
const crypto = require('crypto');

// TODO: https://git.popcorntime.io/popcorntime/opensubtitles-api
const OS = require('opensubtitles-api');
let openSubtitleUser = process.env.MOVIESHARK_OPENSUBTITLE_USER;
let openSubtitlePass = crypto.createHash('md5').update(process.env.MOVIESHARK_OPENSUBTITLE_PASS).digest('hex');
let OpenSubtitles = new OS('UserAgent', openSubtitleUser, openSubtitlePass, 'http://api.opensubtitles.org:80/xml-rpc');

let _convertSrtToVtt = (vttPath, filename) => {
    let srtData = fs.readFileSync(filename);
    srt2vtt(srtData, (err, vttData) => {
        if (err) {
            return log.error(err);
        }

        let file = path.basename(filename);
        let vttFile = vttPath + file.replace('.srt', '.vtt');
        fs.writeFileSync(vttFile, vttData);
    });
};

let _downloadSrt = (srtPath, vttPath, url) => {
    let filename = srtPath + path.basename(url);
    let out = fs.createWriteStream(filename);
    request(url)
        .on('end', () => {
            out.end(() => {
                try {
                    _convertSrtToVtt(vttPath, filename);
                } catch (err) {
                    log.error(err);
                    log.error(`Error converting subtitle: ${filename}`);
                }
            });
        })
        .pipe(out);
};

let _downloadSerieSubs = (subtitles, imdb_code, season, episode) => {
    if (!subtitles) {
        return;
    }

    let seriePath = path.normalize(`${path.resolve(__dirname, '..', `public/subtitles/${imdb_code}`)}/`);
    let seasonPath = path.normalize(`${seriePath}${season}/`);
    let episodePath = path.normalize(`${seasonPath}${episode}/`);

    if (!fs.existsSync(episodePath)) {

        if (!fs.existsSync(seriePath)) {
            fs.mkdirSync(seriePath);
        }

        if (!fs.existsSync(seasonPath)) {
            fs.mkdirSync(seasonPath);
        }

        fs.mkdirSync(episodePath);

        let srtPath = path.normalize(`${episodePath}srt/`);
        if (!fs.existsSync(srtPath)) {
            fs.mkdirSync(srtPath);
        }

        let vttPath = path.normalize(`${episodePath}vtt/`);
        if (!fs.existsSync(vttPath)) {
            fs.mkdirSync(vttPath);
        }

        async.each(subtitles, (language, cb) => {
            _downloadSrt(srtPath, vttPath, language);
            cb();
        });
    }
};

let _downloadZip = (zipPath, srtPath, vttPath, url) => {
    let filename = zipPath + path.basename(url);
    let out = fs.createWriteStream(filename);
    request(url)
        .on('end', () => {
            out.end(() => {
                try {
                    let zip = new AdmZip(filename);
                    zip.extractAllTo(srtPath, true);
                    let zipEntries = zip.getEntries();
                    async.each(zipEntries, (entry, cbEntry) => {
                        if (path.extname(entry.entryName) !== '.srt') {
                            return cbEntry();
                        }

                        let newName = path.join(srtPath, path.basename(filename).replace('.zip', '.srt'));
                        let entryPath = srtPath + entry.entryName;
                        fs.renameSync(entryPath, newName);
                        _convertSrtToVtt(vttPath, newName);
                        cbEntry();
                    });
                } catch (err) {
                    log.error(`Error unzipping subtitle: ${filename}`);
                }
            });
        })
        .pipe(out);
};

let _downloadVtt = (vttPath, url) => {
    let filename = vttPath + path.basename(url);
    let out = fs.createWriteStream(filename);
    request(url).pipe(out);
};

let _downloadMovieSubs = (subtitles, imdb_code) => {
    if (!subtitles) {
        return;
    }

    let moviePath = `${path.resolve(__dirname, '..', `public/subtitles/${imdb_code}`)}/`;
    if (!fs.existsSync(moviePath)) {
        fs.mkdirSync(moviePath);

        let srtPath = path.normalize(`${moviePath}srt/`);
        if (!fs.existsSync(srtPath)) {
            fs.mkdirSync(srtPath);
        }

        let vttPath = path.normalize(`${moviePath}vtt/`);
        if (!fs.existsSync(vttPath)) {
            fs.mkdirSync(vttPath);
        }

        async.each(subtitles, (language, cb) => {
            let subtitle = language.sort((a, b) => { return a.rating < b.rating; })[0];

            let url = provider.subtitles().prefix + subtitle.url;
            let extension = path.extname(url);

            switch (extension) {
                case '.zip':
                    let zipPath = path.normalize(`${moviePath}zip/`);
                    if (!fs.existsSync(zipPath)) {
                        fs.mkdirSync(zipPath);
                    }
                    _downloadZip(zipPath, srtPath, vttPath, url);
                    break;
                case '.srt':
                    _downloadSrt(srtPath, vttPath, url);
                    break;
                case '.vtt':
                    _downloadVtt(vttPath, url);
                    break;
            }
            cb();
        });
    }
};

let _languageMapping = {
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

exports.getMovieSubs = (imdb_code, cb) => {
    request
        .get({
            url: `${provider.subtitles().url}/${imdb_code}`,
            json: true
        }, (err, response, body) => {
            if (!err && response.statusCode === 200 && !!body && body.success && body.subtitles > 0) {
                let subtitles = body.subs[imdb_code];
                cb(null, subtitles);
                _downloadMovieSubs(subtitles, imdb_code);
            }

            request
                .get({
                    url: `${provider.subtitles().mirrorUrl}/${imdb_code}`,
                    json: true
                }, (err, response, body) => {
                    if (err || response.statusCode >= 400 || !body || !body.success) {
                        return cb(err);
                    }

                    let subtitles = body.subtitles > 0 ? body.subs[imdb_code] : [];
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
exports.getSerieSubs = (query, cb) => {
    query.extensions = ['srt', 'vtt'];
    OpenSubtitles
        .search(query)
        .then(subtitles => {
            console.log('SUBTITLES: ', subtitles);
        });
    // var userAgent = 'Popcorn Time v1';
    // openSRT.searchEpisode(query, userAgent).then(function (subtitles) {
        let subs = {};
    //     for (var lang in subtitles) {
    //         var language = _languageMapping[lang];
    //         subs[language] = subtitles[lang].url
    //     }
        cb(null, subs);
    //     _downloadSerieSubs(subs, query.imdbid, query.season, query.episode);
    // });
};
