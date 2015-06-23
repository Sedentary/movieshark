/*jslint node: true */

'use strict';

var async = require('async');
var request = require('request');
var provider = require('../services/provider');

exports.index = function (req, res, next) {
  var current = req.params.page || 1;
  async.parallel({
    series: function (cb) {
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
      series: results.series,
      pagination: results.pagination,
      current: current
    });
  });
};

exports.show = function (req, res, next) {
  var uri = provider.serie('show/' + req.params.id);
  request
    .get({
        uri: uri
    }, function (err, response, body) {
        if (err)
            return next(err);

        var movie = JSON.parse(body);
        var episode = movie.episodes[req.params.index || 0];
        var data = {
            id: movie._id,
            title: movie.title,
            synopsis: movie.synopsis,
            poster: movie.images.banner,
            magnet: episode.torrents['480p'].url,
            episode: episode,
            episodes: movie.episodes
        }
        return res.render('movie/stream', data);
    });
};
