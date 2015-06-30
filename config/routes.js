/*jslint node: true */

module.exports = function (app) {

    'use strict';

    var log = require('winston');
    var request = require('request');
    var requestDebug = require('request-debug');

    var dashboard = require('../app/routes/dashboard');
    var serie = require('../app/routes/serie');
    var series = require('../app/routes/series');
    var movie = require('../app/routes/movie');
    var movies = require('../app/routes/movies');
    var stream = require('../app/routes/stream');
    var tos = require('../app/routes/tos');

    requestDebug(request, function(type, data, r) {
        if (data.method && data.uri)
            log.info('%s %s', data.method, data.uri);
    });

    app.use('/serie', serie);
    app.use('/series', series);
    app.use('/movie', movie);
    app.use('/movies', movies);
    app.use('/stream', stream);
    app.use('/tos', tos);
    app.use('/', dashboard);

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handlers

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function (err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
};
