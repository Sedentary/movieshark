'use strict';

const request = require('request');

const URL = 'http://butter.vodo.net/popcorn';

let _format = function (items) {
    let results = {};
    let movieFetch = {};
    movieFetch.results = [];
    movieFetch.hasMore = (Number(items.length) > 1 ? true : false);
    items.forEach(function (movie) {
        if (movie.Quality === '3D') {
            return;
        }
        let imdb = movie.ImdbCode;

        // Calc torrent health
        let seeds = 0; //XXX movie.TorrentSeeds;
        let peers = 0; //XXX movie.TorrentPeers;

        let torrents = {};
        torrents[movie.Quality] = {
            url: movie.TorrentUrl,
            size: movie.SizeByte,
            filesize: movie.Size,
            seed: seeds,
            peer: peers
        };

        let ptItem = results[imdb];
        if (!ptItem) {
            ptItem = {
                imdb: imdb,
                title: movie.MovieTitleClean.replace(/\([^)]*\)|1080p|DIRECTORS CUT|EXTENDED|UNRATED|3D|[()]/g, ''),
                year: movie.MovieYear,
                genre: [movie.Genre],
                rating: movie.MovieRating,
                image: movie.CoverImage,
                cover: movie.CoverImage,
                backdrop: movie.CoverImage,
                torrents: torrents,
                subtitle: {}, // TODO
                trailer: false,
                synopsis: movie.Synopsis || 'No synopsis available.',
                type: 'movie'
            };

            movieFetch.results.push(ptItem);
        }

        results[imdb] = ptItem;
    });

    return movieFetch.results;
};

exports.movies = function (cb) {
    request
        .get({
            url: URL,
            json: true,
            strictSSL: false
        }, (err, response, body) => {
            if (err) {
                return cb(err);
            }

            if (response.statusCode !== 200 || !body) {
                return cb({ message : 'Movies are temporarily unavailable. Try again later :)' });
            }

            return cb(null, _format(body.downloads));
        });
};
