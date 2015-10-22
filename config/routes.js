'use strict';

module.exports = app => {

    const log = require('winston');
    const request = require('request');
    const requestDebug = require('request-debug');

    // routes
    const dashboard = require('../app/routes/dashboard');
    const serie = require('../app/routes/serie');
    const series = require('../app/routes/series');
    const movie = require('../app/routes/movie');
    const movies = require('../app/routes/movies');
    const stream = require('../app/routes/stream');
    const tos = require('../app/routes/tos');

    requestDebug(request, (type, data, r) => {
        if (data.method && data.uri) {
            log.info('%s %s', data.method, data.uri);
        }
    });

    app.use((req, res, next) => {
        var url = req.url;
        res.locals.url = url === '/' ? '' : url;
        next();
    });

    app.use('/serie', serie);
    app.use('/series', series);
    app.use('/movie', movie);
    app.use('/movies', movies);
    app.use('/stream', stream);
    app.use('/tos', tos);
    app.use('/', dashboard);

    // catch 404 and forward to error handler
    app.use((req, res, next) => {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handlers

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use((err, req, res, next) => {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
};
