/*jslint node: true */

'use strict';

var async = require('async');
var request = require('request');
var provider = require('../services/provider');
var torrent = require('../services/torrent');

exports.index = function (req, res, next) {
    var current = Number(req.params.page || 1);
    request
        .get({
            url: provider.movie('list_movies.json'),
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
    var movie_id = req.params.id;

    async.parallel({
        movie : function (cb) {
            request
                .get({
                    url: provider.movie('movie_details.json'),
                    json: true,
                    qs: {
                        movie_id: movie_id,
                        with_images: true,
                        with_cast: true
                    }
                }, function (err, response, body) {
                    if (err)
                        return cb(err);

                    return cb(null, body.data)                    
                });
        },
        comments : function (cb) {
            request
                .get({
                    url: provider.movie('movie_comments.json'),
                    json: true,
                    qs: {
                        movie_id: movie_id
                    }
                }, function (err, response, body) {
                    if (err)
                        return cb(err);
                    var data = body.data;
                    return cb(null, {
                        list: data.comments,
                        count: data.comment_count
                    });
                });
        },
        suggestions : function (cb) {
            request
                .get({
                    url: provider.movie('movie_suggestions.json'),
                    json: true,
                    qs: {
                        movie_id: movie_id
                    }
                }, function (err, response, body) {
                    if (err)
                        return cb(err);

                    return cb(null, body.data.movie_suggestions);
                });
        }
    }, function (err, results) {
        if (err)
            return next(err);

        var movie = results.movie;
        var magnet = torrent.magnetize({
            name: movie.title_long,
            hash: movie.torrents[0].hash
        });

        return res.render('movie/stream', {
            title: movie.title,
            synopsis: movie.description_full,
            poster: movie.images.large_screenshot_image1,
            magnet: magnet,
            rating: movie.rating,
            comments: results.comments,
            suggestions: results.suggestions
        });
    });
};