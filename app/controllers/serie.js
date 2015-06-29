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

var _getSerie = function (serieId, cb) {
    var key = 'serie-' + serieId;

    client.get(key, function (err, serie) {
        if (err)
            return cb(err);

        if (serie)
            return cb(null, JSON.parse(serie));

        var uri = provider.serie('show/' + serieId);
        //noinspection JSLint
        request
            .get({
                uri: uri,
                json: true
            }, function (err, response, body) {
                if (err)
                    return cb(err);

                client.set(key, JSON.stringify(body));
                client.expire(key, (2 * 60));
                cb(null, body);
            });
    });
}

exports.show = function (req, res, next) {
    _getSerie(req.params.id, function (err, serie) {
        if (err)
            return next(err);

        var seasons = {}
        var firstSeason;
        async.each(serie.episodes, function (epi, cb) {
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
                id: serie._id,
                title: serie.title,
                synopsis: serie.synopsis,
                poster: serie.images.banner,
                magnet: torrent.url,
                peers: torrent.peers,
                seeds: torrent.seeds,
                ratio: (torrent.seeds / torrent.peers),
                episode: episode,
                seasons: seasons,
                rating: (serie.rating.percentage / 10)
            };

            subtitle.get(serie.imdb_id, function (err, subtitles) {
                if (err)
                    return next(err);

                data.subtitles = subtitles;
                return res.render('serie/stream', data);
            });
        });
    })
};

exports.search = function (req, res, next) {
    var search = req.query.q;
    var uri = provider.serie('shows/search/' + search);
    request
        .get({
            uri: uri,
            json: true
        }, function (err, response, body) {
            if (err)
                return next(err);

            return res.render('dashboard/index', {
                series: body,
                q: search
            });
        });
}