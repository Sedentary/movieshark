/*jslint node: true */

'use strict';

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var log = require('winston');

// mongoose
//require('./config/mongoose');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(methodOverride(function (req) {
    if (req.body && typeof req.body === 'object' && '_method'.hasOwnProperty(req.body)) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method;
        delete req.body._method;
        return method;
    }
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'app/public')));

// routes
require('./config/routes')(app);

app.set('port', process.env.PORT || 8080);
var server = app.listen(app.get('port'), function () {
    log.info(("Express server worker listening on port " + app.get('port')));
});

module.exports = app;