'use strict';

const async = require('async');
const request = require('request');
const provider = require('../services/provider');
const redis = require('../services/redis');
let client = redis.getClient();

let clientExpire = (5 * 60); // 5 minutes

exports.index = (req, res, next) => {
    let current = req.params.page || 1;

    async.parallel({
        movies: cb => {
            let key = `dashboard-movies-${current}`;
            client.get(key, (err, movies) => {
                if (err) {
                    return cb(err);
                }

                if (movies) {
                    return cb(null, JSON.parse(movies));
                }

                request
                    .get({
                        uri: provider.movie('list_movies.json'),
                        json: true,
                        qs: {
                            page: current,
                            sort_by: 'seeds'
                        }
                    }, (err, response, body) => {
                        if (err) {
                            return cb(err);
                        }

                        if (!body) {
                            return cb({ message : 'Movies are temporarily unavailable. Try again later :)' });
                        }

                        let movies = body.data.movies;

                        client.set(key, JSON.stringify(movies));
                        client.expire(key, clientExpire);

                        return cb(null, movies);
                    });
            });
        },
        series: cb => {
            let key = `dashboard-series-${current}`;
            client.get(key, (err, series) => {
                if (err) {
                    return cb(err);
                }

                if (series) {
                    return cb(null, JSON.parse(series));
                }

                request
                    .get({
                        uri: provider.serie(`shows/${current}`),
                        json: true
                    }, (err, response, body) => {
                        if (err) {
                            return cb(err);
                        }

                        if (response.statusCode !== 200) {
                            return cb(null, null);
                        }

                        client.set(key, JSON.stringify(body));
                        client.expire(key, clientExpire);

                        return cb(null, body);
                    });
            });
        },
        pagination: cb => {
            let key = 'dashboard-pagination';
            client.get(key, (err, pagination) => {
                if (err) {
                    return cb(err);
                }

                if (pagination) {
                    return cb(null, JSON.parse(pagination));
                }

                request
                    .get({
                        uri: provider.serie('shows'),
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
            movies: results.movies,
            series: results.series,
            pagination: results.pagination,
            current: current
        });
    });
};

exports.search = (req, res, next) => {
    let search = req.query.q;

    async.parallel({
        movies: cb => {
            request
                .get({
                    uri: provider.movie('list_movies.json'),
                    json: true,
                    qs: {
                        sort_by: 'seeds',
                        query_term: search
                    }
                }, (err, response, body) => {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, body.data.movies);
                });
        },
        series: cb => {
            request
                .get({
                    uri: provider.serie(`shows/search/${search}/all`),
                    json: true
                }, (err, response, body) => {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, body);
                });
        }
    }, (err, results) => {
        if (err) {
            return next(err);
        }

        return res.render('dashboard/index', {
            movies: results.movies,
            series: results.series,
            q: search
        });
    });
};
