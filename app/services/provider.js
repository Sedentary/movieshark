/*jslint node: true */

'use strict';

exports.movie = function (uri) {
    return 'https://yts.to/api/v2/' + uri;
};

exports.serie = function (uri) {
    return 'http://eztvapi.re/' + uri;
};

exports.subtitles = function () {
    return {
        url: 'http://api.yifysubtitles.com/subs',
        mirrorUrl: 'http://api.ysubs.com/subs',
        prefix: 'http://www.yifysubtitles.com'
    };
};