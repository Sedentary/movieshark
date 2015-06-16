/*jslint node: true */

'use strict';

var request = require('request');

//TODO put in a service
var _listMovies = function (callback) {
  var url = 'http://eztvapi.re/shows/1';
  request({
    uri: url,
    method: 'GET'
  }, function (err, response, body) {
    if (err) {
      callback(err);
    }

    var movies = JSON.parse(body);
    callback(null, movies);
  });
};

exports.index = function (req, res, next) {
  _listMovies(function (err, movies) {
    if (err) {
      return next(err);
    }

    return res.render('dashboard/index', {movies: movies});
  });
};