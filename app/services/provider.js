/*jslint node: true */

'use strict';

exports.movie = function (uri) {
  return 'https://yts.to/api/v2/' + uri;
}

exports.serie = function (uri) {
  return 'http://eztvapi.re/' + uri;
}