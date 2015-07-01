/*jslint node: true */

'use strict';

var async = require('async');
var request = require('request');
var provider = require('../services/provider');
var torrent = require('../services/torrent');
var redis = require('../services/redis');
var client = redis.getClient();
var subtitle = require('../services/subtitle');

var _renderMovies = function (res, current, data) {
    var movies = data.movies;
    var total_pages = Math.round(data.movie_count / data.limit);
    var total_pagination = current + data.limit;

    var pagination = [];
    for (var i = current; i < total_pagination; i++) {
        if (i < total_pages)
            pagination.push(String(i));
    }

    return res.render('dashboard/index', {
        movies: movies,
        pagination: pagination,
        current: current
    });
};

exports.index = function (req, res, next) {
    var current = Number(req.params.page || 1);
    var key = 'movies-' + current;
    client.get(key, function (err, data) {
        if (err)
            return next(err);

        if (data)
            return _renderMovies(res, current, JSON.parse(data));

        request
            .get({
                url: provider.movie('list_movies.json'),
                json: true,
                qs: {
                    page: current,
                    sort_by: 'seeds'
                }
            }, function (err, response, body) {
                if (err)
                    return next(err);

                var data = body.data;
                client.set(key, JSON.stringify(data));
                client.expire(key, (5 * 60));

                return _renderMovies(res, current, data);
            });
    });
};

exports.show = function (req, res, next) {
    var movie_id = req.params.id;

    var key = 'movie-' + movie_id;
    client.get(key, function (err, data) {
        if (err)
            return next(err);

        var template = 'movie/stream';

        if (data)
            return res.render(template, JSON.parse(data));

        async.parallel({
            movie: function (cb) {
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
            comments: function (cb) {
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
            suggestions: function (cb) {
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
            var tor = movie.torrents[0];
            var magnet = torrent.magnetize({
                name: movie.title_long,
                hash: tor.hash
            });

            var imdb_code = movie.imdb_code;

            var dataRender = {
                title: movie.title,
                synopsis: movie.description_full,
                poster: movie.images.large_screenshot_image1,
                magnet: magnet,
                rating: movie.rating,
                comments: results.comments,
                suggestions: results.suggestions,
                peers: tor.peers,
                seeds: tor.seeds,
                ratio: (tor.seeds / tor.peers),
                imdb_code: imdb_code
            };

            subtitle.getMovieSubs(imdb_code, function (err, subtitles) {
                if (err)
                    return next(err);

                dataRender.subtitles = subtitles;

                client.set(key, JSON.stringify(dataRender));
                client.expire(key, (2 * 60));

                return res.render('movie/stream', dataRender);
            });
        });
    });
};

exports.search = function (req, res, next) {
    var search = req.query.q;
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
                return next(err);

            var movies = body.data.movies;

            return res.render('dashboard/index', {
                movies: movies,
                q: search
            });
        });
};