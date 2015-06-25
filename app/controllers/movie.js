/*jslint node: true */

'use strict';

var async = require('async');
var request = require('request');
var provider = require('../services/provider');

exports.index = function (req, res, next) {
    var current = Number(req.params.page || 1);
    request
        .get({
            uri: provider.movie('list_movies.json'),
            json: true,
            qs: {
                page: current,
                sort_by: 'download_count',
                order_by: 'desc'
            }
        }, function (err, response, body) {
            if (err)
                return next(err);

            var data = body.data;
            var movies = data.movies;
            var total_pages = Math.round(data.movie_count / data.limit);
            var pagination = [];
            var total_pagination = current + data.limit;

            for (var i = current; i < total_pagination; i++) {
                if (i < total_pages)
                    pagination.push('/movies/' + i);
            }

            return res.render('dashboard/index', {
                movies: movies,
                pagination: pagination,
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

            return res.render('movie/stream', {movie: body});
        });
};