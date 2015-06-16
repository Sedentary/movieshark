/*jslint node: true */

'use strict';

var async = require('async');
var request = require('request');

exports.show = function (req, res, next) {
  var id = req.params.id || 1;

  async.parallel({
    movie: function (cb) {
      var uri = 'http://eztvapi.re/show/' + id;
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
    }
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    return res.render('movie/stream', { movie: results.movie });
  });
};