'use strict';

const async = require('async');
const request = require('request');
const provider = require('../services/provider');
const redis = require('../services/redis');
let client = redis.getClient();
let clientExpire = (5 * 60);
const subtitle = require('../services/subtitle');

exports.index = (req, res, next) => {
    let current = req.params.page || 1;

    async.parallel({
        series: cb => {
            let key = `series-${current}`;
            client.get(key, (err, series) => {
                if (err) {
                    return cb(err);
                }

                if (series) {
                    return cb(null, JSON.parse(series));
                }

                request
                    .get({
                        url: provider.serie(`shows/${current}`),
                        json: true
                    }, (err, response, body) => {
                        if (err) {
                            return cb(err);
                        }

                        client.set(key, JSON.stringify(body));
                        client.expire(key, clientExpire);

                        return cb(null, body);
                    });
            });
        },
        pagination: cb => {
            let key = 'series-pagination';
            client.get(key, (err, pagination) => {
                if (err) {
                    return cb(err);
                }

                if (pagination) {
                    return cb(null, JSON.parse(pagination));
                }

                request
                    .get({
                        url: provider.serie('shows'),
                        json: true
                    }, (err, response, body) => {
                        if (err) {
                            return cb(err);
                        }

                        client.set(key, JSON.stringify(body));
                        client.expire(key, clientExpire);

                        return cb(null, body);
                    });
            });
        }
    }, (err, results) => {
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

let _getSerie = (serieId, cb) => {
    let key = `serie-${serieId}`;

    client.get(key, (err, serie) => {
        if (err) {
            return cb(err);
        }

        if (serie) {
            return cb(null, JSON.parse(serie));
        }

        request
            .get({
                uri: provider.serie(`show/${serieId}`),
                json: true
            }, (err, response, body) => {
                if (err) {
                    return cb(err);
                }

                client.set(key, JSON.stringify(body));
                client.expire(key, (2 * 60));
                cb(null, body);
            });
    });
};

exports.show = (req, res, next) => {
    _getSerie(req.params.id, (err, serie) => {
        if (err) {
            return next(err);
        }

        let seasons = {};
        let firstSeason;

        async.each(serie.episodes, (epi, cb) => {
            let season = epi.season;

            if (!firstSeason || firstSeason > season) {
                firstSeason = season;
            }

            if (!!seasons[season]) {
                seasons[season].push(epi);
            } else {
                seasons[season] = [epi];
            }

            cb();
        }, () => {
            let episode = seasons[req.params.season || firstSeason][req.params.episode || 0];
            let torrent = episode.torrents['480p'];
            let data = {
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
                rating: (serie.rating.percentage / 10),
                imdb_code: `${serie.imdb_id}/${episode.season}/${episode.episode}`
            };

            subtitle.getSerieSubs({
                imdbid: serie.imdb_id,
                season: episode.season,
                episode: episode.episode
            }, (err, subtitles) => {
                if (err) {
                    return next(err);
                }

                data.subtitles = subtitles;
                return res.render('serie/stream', data);
            });
        });
    });
};

exports.search = (req, res, next) => {
    let search = req.query.q;
    request
        .get({
            uri: provider.serie(`shows/search/${search}'/all`),
            json: true
        }, (err, response, body) => {
            if (err) {
                return next(err);
            }

            return res.render('dashboard/index', {
                series: body,
                q: search
            });
        });
};
