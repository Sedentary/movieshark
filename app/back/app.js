/**
 * Created by Rodrigo on 10/06/2015.
 */
var express = require('express');
var http = require("http");

var app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get(/.*/, function (req, res) {
    var options = {
        host: 'eztvapi.re',
        path: req.url,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    var request = http.request(options, function (r) {
        var output = '';

        r.setEncoding('utf8');

        r.on('data', function (chunk) {
            output += chunk;
        });

        r.on('end', function () {
            var obj = JSON.parse(output);
            res.json(obj);
        });
    });

    request.on('error', function (err) {
        res.send('error: ' + err.message);
    });

    request.end();
});

var server = app.listen(3000, function () {

    var host = server.address().host;
    var port = server.address().port;

    console.log('Listening at http://%s:%s', host, port);
});