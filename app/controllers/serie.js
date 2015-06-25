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
            //noinspection JSLint
            request
                .get({
                    url: uri
                }, function (err, response, body) {
                    if (err) {
                        return cb(err);
                    }

                    var data = body ? JSON.parse(body) : [];

                    return cb(null, data);
                });
        },
        pagination: function (cb) {
            //noinspection JSLint
            request
                .get({
                    url: provider.serie('shows')
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
            series: results.series,
            pagination: results.pagination,
            current: current
        });
    });
};

exports.show = function (req, res, next) {
    var uri = provider.serie('show/' + req.params.id);
    //noinspection JSLint
    request
        .get({
            uri: uri,
            json: true
        }, function (err, response, body) {
            if (err)
                return next(err);

            var movie = body;
            var seasons = {}
            var firstSeason;
            async.each(movie.episodes, function (epi, cb) {
                var season = epi.season;
                if (!firstSeason || firstSeason > season)
                    firstSeason = season

                if (!!seasons[season]) {
                    seasons[season].push(epi);
                } else {
                    seasons[season] = [epi];
                }
                cb();
            }, function () {
                var episode = seasons[req.params.season || firstSeason][req.params.episode || 0];
                var torrent = episode.torrents['480p'];
                var data = {
                    id: movie._id,
                    title: movie.title,
                    synopsis: movie.synopsis,
                    poster: movie.images.banner,
                    magnet: torrent.url,
                    peers: torrent.peers,
                    seeds: torrent.seeds,
                    ratio: (torrent.seeds / torrent.peers),
                    episode: episode,
                    seasons: seasons,
                    rating: (movie.rating.percentage / 10)
                };
                return res.render('serie/stream', data);
            });
        });
};
