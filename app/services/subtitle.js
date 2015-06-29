/*jslint node: true */

'use strict';

var provider = require('./provider');
var async = require('async');
var request = require('request');
var fs = require('fs');
var AdmZip = require('adm-zip');
var path = require('path');
var log = require('winston');

exports.download = function (subtitles, imdb_code) {
    var moviePath = path.resolve(__dirname, '..', 'public/subtitles/' + imdb_code) + '/';
    if (!fs.existsSync(moviePath)) {
        fs.mkdirSync(moviePath);

        var zipPath = moviePath + 'zip/';
        if (!fs.existsSync(zipPath)) {
            fs.mkdirSync(zipPath);
        }

        async.each(subtitles, function (language, cb) {
            var subtitle = language.sort(function (a, b) { return a.rating < b.rating })[0];
            var url = provider.subtitles().prefix + subtitle.url;
            var filename = zipPath + url.replace(/.*\//, '');

            var out = fs.createWriteStream(filename);

            request(url)
                .on('end', function () {
                    out.end(function () {
                        try {
                            var zip = new AdmZip(filename);
                            zip.extractAllTo(moviePath, true);
                            var zipEntries = zip.getEntries();
                            for (var i = 0, l = zipEntries.length; i < l; i++) {
                                var entry = zipEntries[i];
                                if (entry.entryName.indexOf('.srt') !== -1) {
                                    var entryPath = moviePath + entry.entryName
                                    var newName = path.join(moviePath, filename.replace(/.*\//, '').replace('.zip', '.srt'));
                                    fs.renameSync(entryPath, newName);
                                    break;
                                }    
                            }
                        } catch (err) {
                            log.error('Error unzip subtitle: ', filename);
                        }
                    });
                })
                .pipe(out);

            cb();
        });
    }
}

exports.languageMapping = languageMapping;

var languageMapping = {
    'albanian': 'sq',
    'arabic': 'ar',
    'bengali': 'bn',
    'brazilian-portuguese': 'pt-br',
    'bulgarian': 'bg',
    'bosnian': 'bs',
    'chinese': 'zh',
    'croatian': 'hr',
    'czech': 'cs',
    'danish': 'da',
    'dutch': 'nl',
    'english': 'en',
    'estonian': 'et',
    'farsi-persian': 'fa',
    'finnish': 'fi',
    'french': 'fr',
    'german': 'de',
    'greek': 'el',
    'hebrew': 'he',
    'hungarian': 'hu',
    'indonesian': 'id',
    'italian': 'it',
    'japanese': 'ja',
    'korean': 'ko',
    'lithuanian': 'lt',
    'macedonian': 'mk',
    'malay': 'ms',
    'norwegian': 'no',
    'polish': 'pl',
    'portuguese': 'pt',
    'romanian': 'ro',
    'russian': 'ru',
    'serbian': 'sr',
    'slovenian': 'sl',
    'spanish': 'es',
    'swedish': 'sv',
    'thai': 'th',
    'turkish': 'tr',
    'urdu': 'ur',
    'ukrainian': 'uk',
    'vietnamese': 'vi'
}