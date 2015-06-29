/*jslint node: true */

'use strict';

var async = require('async');
var request = require('request');
var provider = require('../services/provider');
var redis = require('../services/redis');
var client = redis.getClient();

var clientExpire = (5 * 60); // 5 minutes

exports.index = function (req, res, next) {
    var current = req.params.page || 1;

    async.parallel({
        movies: function (cb) {
            var key = 'dashboard-movies-' + current;
            client.get(key, function (err, movies) {
                if (err)
                    return cb(err);

                if (movies)
                    return cb(null, JSON.parse(movies));

                var uri = provider.movie('list_movies.json');
                request
                    .get({
                        uri: uri,
                        json: true,
                        qs: {
                            page: current,
                            sort_by: 'download_count',
                            order_by: 'desc'
                        }
                    }, function (err, response, body) {
                        if (err)
                            return cb(err);

                        var movies = body.data.movies

                        client.set(key, JSON.stringify(movies));
                        client.expire(key, clientExpire);

                        return cb(null, movies);
                    });
            });
        },
        series: function (cb) {
            var key = 'dashboard-series-' + current;
            client.get(key, function (err, series) {
                if (err)
                    return cb(err);

                if (series)
                    return cb(null, JSON.parse(series));

                var uri = provider.serie('shows/' + current);
                request
                    .get({
                        uri: uri,
                        json: true
                    }, function (err, response, body) {
                        if (err)
                            return cb(err);

                        client.set(key, JSON.stringify(body));
                        client.expire(key, clientExpire);

                        return cb(null, body);
                    });
            })
        },
        pagination: function (cb) {
            var key = 'dashboard-pagination';
            client.get(key, function (err, pagination) {
                if (err)
                    return cb(err);

                if (pagination)
                    return cb(null, JSON.parse(pagination));

                request
                    .get({
                        uri: provider.serie('shows'),
                        json: true
                    }, function (err, response, body) {
                        if (err)
                            return cb(err);

                        async.concat(body, function (pag, cbPag) {
                            cbPag(null, pag.replace(/.*\//, ''));
                        }, function (err, pages) {
                            client.set(key, JSON.stringify(pages));
                            client.expire(key, clientExpire);
                            return cb(null, pages);
                        })
                    });
            });
        }
    }, function (err, results) {
        if (err)
            return next(err);

        return res.render('dashboard/index', {
            movies: results.movies,
            series: results.series,
            pagination: results.pagination,
            current: current
        });
    });
};

exports.search = function (req, res, next) {
    var search = req.query.q;

    async.parallel({
        movies: function (cb) {
            var uri = provider.movie('list_movies.json');
            request
                .get({
                    uri: uri,
                    json: true,
                    qs: {
                        sort_by: 'download_count',
                        order_by: 'desc',
                        query_term: search
                    }
                }, function (err, response, body) {
                    if (err)
                        return cb(err);

                    var movies = body.data.movies

                    return cb(null, movies);
                });
        },
        series: function (cb) {
            var uri = provider.serie('shows/search/' + search);
            request
                .get({
                    uri: uri,
                    json: true
                }, function (err, response, body) {
                    if (err)
                        return cb(err);

                    return cb(null, body);
                });
        }
    }, function (err, results) {
        if (err)
            return next(err);

        return res.render('dashboard/index', {
            movies: results.movies,
            series: results.series,
            q: search
        });
    });
};