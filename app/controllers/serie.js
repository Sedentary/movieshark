/*jslint node: true */

'use strict';

var async = require('async');
var request = require('request');
var WebTorrent = require('webtorrent');
var BinaryServer = require('binaryjs').BinaryServer;
var provider = require('../services/provider');
var server = require('../../app').listen();

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

        var data = JSON.parse(body);

        var url = data.episodes[0].torrents['480p'].url;

        

        // return res.render('movie/stream', { movie: data });
    });
};

exports.stream = function (req, res, next) {
    var client = new WebTorrent();

    client.add(req.body.magnet, function (torrent) {
        // Got torrent metadata!
        console.log('Torrent info hash:', torrent.infoHash)

        // Let's say the first file is a webm (vp8) or mp4 (h264) video...
        var file = torrent.files[0]

        var bs = BinaryServer({ server: server });

        // Wait for new user connections
        bs.on('connection', function(client){
            // Incoming stream from browsers
            client.on('stream', function(stream, meta) {
                stream.pipe(file.createReadStream());

                // Send progress back
                stream.on('data', function(data){
                    stream.write({rx: data.length / meta.size});
                });
            });
        });
    })
}