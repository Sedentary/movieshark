/*jslint node: true */

'use strict';

var log = require('winston');
var redis = require('redis');
var url = require('url');

var client

if (process.env.REDISCLOUD_URL) {
    var urlParse = url.parse(redisUrl);
    client = redis.createClient(urlParse.port, urlParse.hostname, { no_ready_check: true });
    client.auth(urlParse.auth.split(":")[1]);    
} else {
    client = redis.createClient(6379, '127.0.0.1', { no_ready_check: true });
}

client.on('error', function (err) {
    log.error('Redis connection error: ', err.message);
});

client.on('ready', function callback() {
    log.info("Connected to Redis!");
});

exports.getClient = function () {
    return client;
}