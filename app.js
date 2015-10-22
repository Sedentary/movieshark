'use strict';

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const log = require('winston');
const moment = require('moment');
const expressStatic = require('express-static');
const helmet = require('helmet');
const app = express();

// help secure express apps with various HTTP headers
app.use(helmet());

app.locals.moviesharkurl = 'http://www.movieshark.co';
app.locals.movieshark = 'Movieshark';
app.locals.moment = moment;

// view engine setup
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/app/public/img/movieshark.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(methodOverride(req => {
    if (req.body && typeof req.body === 'object' && '_method'.hasOwnProperty(req.body)) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method;
        delete req.body._method;
        return method;
    }
}));
app.use(cookieParser());
app.use(expressStatic(path.join(__dirname, 'app/public')));

// routes
require('./config/routes')(app);

app.set('port', process.env.PORT || 8080);
var server = app.listen(app.get('port'), () => {
    log.info(`Express server worker listening on port ${app.get('port')}`);
});

module.exports = app;
