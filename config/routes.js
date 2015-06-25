/*jslint node: true */

module.exports = function (app) {

  'use strict';

  var dashboard = require('../app/routes/dashboard');
  var serie = require('../app/routes/serie');
  var series = require('../app/routes/series');
  var movie = require('../app/routes/movie');
  var movies = require('../app/routes/movies');
  var stream = require('../app/routes/stream');


  app.use('/serie', serie);
  app.use('/series', series);
  app.use('/movie', movie);
  app.use('/movies', movies);
  app.use('/stream', stream);
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
