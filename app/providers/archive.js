'use strict';

const moment = require('moment');
const request = require('request');
const async = require('async');

const URL = 'https://archive.org/';

let _format = function (movie) {
	let id = movie.metadata.identifier[0];
    let metadata = movie.metadata;

    let mp4 = { length: 0 };
    for (let key in movie.files) {
        if (key.endsWith('.mp4')) {
            mp4 = movie.files[key];
            break;
        }
    }

    let runtime = Math.floor(moment.duration(Number(mp4.length)*1000).asMinutes());

    let year;

    if (metadata.hasOwnProperty('year')) {
            year = metadata.year[0];
    } else if (metadata.hasOwnProperty('date')) {
            year = metadata.date[0];
    } else if (metadata.hasOwnProperty('addeddate')) {
            year = metadata.addeddate[0];
    } else {
            year = 'UNKNOWN';
    }

    let rating = 0;
    if (movie.hasOwnProperty('reviews')) {
        rating = movie.reviews.info.avg_rating;
    }

    let url = 'http://' + movie.server + movie.dir;
    let turl = '/' + id + '_archive.torrent';
    let torrentInfo = movie.files[turl];

	// Calc torrent health
	let seeds = 0; //XXX movie.TorrentSeeds;
	let peers = 0; //XXX movie.TorrentPeers;
    movie.Quality = '480p'; // XXX


	let torrents = {};
	torrents[movie.Quality] = {
		url: url + turl,
		size: torrentInfo.size,
		seed: seeds,
		peer: peers
	};

    if (movie.misc.image.endsWith('.gif')) {
        movie.misc.image = '';
    }

	return {
        type: 'movie',
		imdb: id,
		title: metadata.title[0],
        genre: metadata.collection,
        year: year,
		rating: rating,
        runtime: runtime,
		image: movie.misc.image,
        cover: movie.misc.image,
		torrents: torrents,
        synopsis: metadata.description,
        subtitle: {} // TODO
	};
};

let _getDetails = function (items, cb) {
    let movies = [];
    async.each(items, function (movie, cbMovie) {
        request({
            url: `${URL}details/${movie.identifier}`,
            json: true,
            qs: {
                output: 'json'
            }
        }, function(err, response, body) {
            if (err) {
                return cbMovie(err);
            }
            if(!body || (body.error && body.error !== 'No movies found')) {
    	        return cbMovie({ message: 'No data returned' });
            }

            movies.push(_format(body));

            return cbMovie();
        });
    }, function (err) {
        if (err) {
            return cb(err);
        }

        return cb(null, movies);
    });
};

exports.movies = function (filters, cb) {
    if (typeof filters === 'function') {
        cb = filters;
        filters = {};
    } else if (!filters) {
        filters = {};
    }

	let params = {
        q: 'collection:moviesandfilms AND -mediatype:collection AND format:"Archive BitTorrent" AND year',
        output: 'json',
        rows: '20'
    };

	if (filters.keywords) {
		params.keywords = filters.keywords.replace(/\s/g, '% ');
	}

	if (filters.genre) {
		params.genre = filters.genre;
	}

    let order = 'desc';
	if(filters.order && filters.order === 1) {
		order = 'asc';
	}

    let sort = 'downloads';
	if (filters.sorter && filters.sorter !== 'popularity') {
		sort = filters.sorter;
	}
    // params['sort[]'] = `${sort}+${order}`;

	if (filters.page) {
		params.page = filters.page;
	}

    request
        .get({
            url: `${URL}advancedsearch.php`,
            json: true,
            qs: params
        }, (err, response, body) => {
            if (err) {
                return cb(err);
            }

            if(!body || (body.error && body.error !== 'No movies found')) {
                return cb({ message: 'No data returned' });
            }

            return _getDetails(body.response.docs || [], cb);
        });
};
