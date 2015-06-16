/*jslint node: true */

'use strict';

var async = require('async');
var request = require('request');

exports.index = function (req, res, next) {
  var current = req.params.show || 1;
  async.parallel({
    movies: function (cb) {
      var uri = 'http://eztvapi.re/shows/' + current;
      request
        .get({
          uri: uri
        }, function (err, response, body) {
          if (err) {
            return cb(err);
          }

          var data = body ? JSON.parse(body) : [];

          return cb(null, data);
        });
    },
    pagination: function (cb) {
      request
        .get({
          uri: 'http://eztvapi.re/shows'
        }, function (err, response, body) {
          if (err) {
            return cb(err);
          }

          return cb(null, JSON.parse(body));
        });
    }
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    return res.render('dashboard/index', {
      movies: results.movies,
      pagination: results.pagination,
      current: current
    });
  });
};