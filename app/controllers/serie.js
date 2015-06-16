/*jslint node: true */

'use strict';

var async = require('async');
var request = require('request');
var provider = require('../services/provider');

exports.index = function (req, res, next) {
  var current = req.params.page || 1;
  async.parallel({
    movies: function (cb) {
      var uri = provider.serie('shows/' + current);
      request
        .get({
          uri: uri
        }, function (err, response, body) {
          if (err)
            return cb(err);

          var data = body ? JSON.parse(body) : [];

          return cb(null, data);
        });
    },
    pagination: function (cb) {
      request
        .get({
          uri: provider.serie('shows')
        }, function (err, response, body) {
          if (err)
            return cb(err);

          return cb(null, JSON.parse(body));
        });
    }
  }, function (err, results) {
    if (err)
      return next(err);

    return res.render('dashboard/index', {
      movies: results.movies,
      pagination: results.pagination,
      current: current
    });
  });
};

exports.show = function (req, res, next) {
  var id = req.params.id || 1;

  async.parallel({
    movie: function (cb) {
      var uri = provider.serie('show/' + id);
      request
        .get({
          uri: uri
        }, function (err, response, body) {
          if (err)
            return cb(err);

          var data = body ? JSON.parse(body) : [];

          return cb(null, data);
        });
    }
  }, function (err, results) {
    if (err)
      return next(err);

    return res.render('movie/stream', { movie: results.movie });
  });
};