/*jslint node: true */

'use strict';

const log = require('winston');
const redis = require('redis');
const url = require('url');

let redisCloudUrl = process.env.REDISCLOUD_URL;
let client;

if (redisCloudUrl) {
    let urlParse = url.parse(redisCloudUrl);
    client = redis.createClient(urlParse.port, urlParse.hostname, { no_ready_check: true });
    client.auth(urlParse.auth.split(':')[1]);
} else {
    client = redis.createClient(6379, '127.0.0.1', { no_ready_check: true });
}

client.on('error', err => {
    log.error('Redis connection error: ', err.message);
});

client.on('ready', () => {
    log.info('Connected to Redis!');
});

exports.getClient = () => {
    return client;
};
