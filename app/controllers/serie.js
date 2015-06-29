/*jslint node: true */

'use strict';

var async = require('async');
var request = require('request');
var provider = require('../services/provider');
var redis = require('../services/redis');
var client = redis.getClient();
var clientExpire = (5 * 60);
var subtitle = require('../services/subtitle');

exports.index = function (req, res, next) {
    var current = req.params.page || 1;

    async.parallel({
        series: function (cb) {
            var key = 'series-' + current;
            client.get(key, function (err, series) {
                if (err)
                    return cb(err);

                if (series)
                    return cb(null, JSON.parse(series));

                var uri = provider.serie('shows/' + current);
                //noinspection JSLint
                request
                    .get({
                        url: uri,
                        json: true
                    }, function (err, response, body) {
                        if (err)
                            return cb(err);

                        client.set(key, JSON.stringify(body));
                        client.expire(key, clientExpire);

                        return cb(null, body);
                    });
            });
        },
        pagination: function (cb) {
            var key = 'series-pagination';
            client.get(key, function (err, pagination) {
                if (err)
                    return cb(err);

                if (pagination)
                    return cb(null, JSON.parse(pagination));

                //noinspection JSLint
                request
                    .get({
                        url: provider.serie('shows'),
                        json: true
                    }, function (err, response, body) {
                        if (err)
                            return cb(err);

                        client.set(key, JSON.stringify(body));
                        client.expire(key, clientExpire);

                        return cb(null, body);
                    });
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

                subtitle.get(movie.imdb_id, function (err, subtitles) {
                    if (err)
                        return next(err);

                    data.subtitles = subtitles;
                    return res.render('serie/stream', data);
                });
            });
        });
};
