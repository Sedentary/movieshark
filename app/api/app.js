/**
 * Created by Rodrigo on 10/06/2015.
 */
var express = require('express');
var http = require("http");

var app = express();

app.get('/', function (req, res) {
    var options = {
        host: 'eztvapi.re',
        path: '/shows/1',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    var req = http.request(options, function (r)
    {
        var output = '';
        console.log(options.host + ':' + r.statusCode);
        r.setEncoding('utf8');

        r.on('data', function (chunk) {
            output += chunk;
        });

        r.on('end', function() {
            var obj = JSON.parse (output);
            res.send(obj);
        });
    });

    req.on('error', function(err) {
        //res.send('error: ' + err.message);
    });

    req.end();
});

var server = app.listen(3000, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});