/*jslint node: true */

'use strict';

var async = require('async');
var request = require('request');
var provider = require('../services/provider');

exports.index = function (req, res, next) {
    var current = req.params.page || 1;
    async.parallel({
        movies: function (cb) {
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

                    return cb(null, body.data.movies);
                });
        },
        series: function (cb) {
            var uri = provider.serie('shows/' + current);
            request
                .get({
                    uri: uri,
                    json: true
                }, function (err, response, body) {
                    if (err)
                        return cb(err);

                    return cb(null, body);
                });
        },
        pagination: function (cb) {
            request
                .get({
                    uri: provider.serie('shows'),
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
            pagination: results.pagination,
            current: current
        });
    });
};