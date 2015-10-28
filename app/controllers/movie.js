'use strict';

const async = require('async');
const request = require('request');
const provider = require('../services/provider');
const torrent = require('../services/torrent');
const redis = require('../services/redis');
let client = redis.getClient();
const subtitle = require('../services/subtitle');
const archive = require('../providers/archive');
const vodo = require('../providers/vodo');

let _renderMovies = (res, current, movies) => {
    // let total_pages = Math.round(movies.movie_count / data.limit);
    // let total_pagination = current + data.limit;
    //
    let pagination = [];
    // for (let i = current; i < total_pagination; i++) {
    //     if (i < total_pages) {
    //         pagination.push(String(i));
    //     }
    // }

    return res.render('dashboard/index', {
        movies: movies,
        pagination: pagination,
        current: current
    });
};

exports.index = (req, res, next) => {
    let current = Number(req.params.page || 1);
    let key = `movies-${current}`;
    client.get(key, (err, data) => {
        if (err) {
            return next(err);
        }

        async.parallel({
            archive: cb => {
                archive.movies({
                    page: current
                }, cb);
            },
            vodo: async.apply(vodo.movies)
        }, (err, result) => {
            if (err) {
                return next(err);
            }

            let data = result.archive.concat(result.vodo);

            client.set(key, JSON.stringify(data));
            client.expire(key, (5 * 60));

            return _renderMovies(res, current, data);
        });
    });
};

exports.show = (req, res, next) => {
    let movie_id = req.params.imdb;

    let key = `movie-${movie_id}`;
    client.get(key, (err, data) => {
        if (err) {
            return next(err);
        }

        let template = 'movie/stream';

        if (data) {
            return res.render(template, JSON.parse(data));
        }

        async.parallel({
            movie: cb => {
                archive.getDetails(movie_id, (err, movie) => {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, movie);
                });
            }/*,
            comments: cb => {
                request
                    .get({
                        url: provider.movie('movie_comments.json'),
                        json: true,
                        qs: {
                            movie_id: movie_id
                        }
                    }, (err, response, body) => {
                        if (err) {
                            return cb(err);
                        }
                        if (!body.data) {
                            return cb({
                                message: 'Failed to load movie details'
                            });
                        }
                        let data = body.data;
                        return cb(null, {
                            list: data.comments,
                            count: data.comment_count
                        });
                    });
            },
            suggestions: cb => {
                request
                    .get({
                        url: provider.movie('movie_suggestions.json'),
                        json: true,
                        qs: {
                            movie_id: movie_id
                        }
                    }, (err, response, body) => {
                        if (err) {
                            return cb(err);
                        }
                        if (!body.data) {
                            return cb({
                                message: 'Failed to load movie details'
                            });
                        }
                        return cb(null, body.data.movie_suggestions);
                    });
            }*/
        }, (err, results) => {
            if (err) {
                return next(err);
            }

            let movie = results.movie;
            let tor = movie.torrents[movie.quality];
            // let magnet = torrent.magnetize({
            //     name: movie.title_long,
            //     hash: tor.hash
            // });

            let imdb_code = movie.imdb;
            
            let dataRender = {
                title: movie.title,
                synopsis: movie.description_full,
                // poster: movie.images.large_screenshot_image1,
                // magnet: magnet,
                rating: movie.rating,
                comments: results.comments,
                suggestions: results.suggestions,
                peers: tor.peer,
                seeds: tor.seed,
                ratio: ((tor.seed > 0) && (tor.peer > 0)) ? (tor.seed / tor.peer) : 0,
                imdb_code: imdb_code
            };

            subtitle.getMovieSubs(imdb_code, (err, subtitles) => {
                if (err) {
                    return next(err);
                }

                dataRender.subtitles = subtitles;

                client.set(key, JSON.stringify(dataRender));
                client.expire(key, (2 * 60));

                return res.render('movie/stream', dataRender);
            });
        });
    });
};

exports.search = (req, res, next) => {
    let search = req.query.q;
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
                return next(err);
            }

            let movies = body.data.movies;

            return res.render('dashboard/index', {
                movies: movies,
                q: search
            });
        });
};
