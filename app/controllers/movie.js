/*jslint node: true */

'use strict';

var async = require('async');
var request = require('request');
var provider = require('../services/provider');

exports.index = function (req, res, next) {
    var current = req.params.page || 1;
    var uri = provider.movie('list_movies.json');
        request
        .get({
            uri: uri,
            qs: {
                q: current,
                sort_by: 'rating',
                order_by: 'desc',
            }
        }, function (err, response, body) {
            if (err)
                return next(err);

            var data = JSON.parse(body).data;

            var pagination = Math.round(data.movie_count / data.limit);
            var movies = data.movies;

            return cb(null, data);
        });
        
  async.parallel({
    series: function (cb) {
      var uri = provider.movie('shows/' + current);
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
          uri: provider.movie('shows')
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

        var data = JSON.parse(body);

        return res.render('movie/stream', { movie: data });
    });
};