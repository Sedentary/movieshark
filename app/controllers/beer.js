/*jslint node: true */

'use strict';

var request = require('request');
var BeerModel = require('../models/beer');

var _findById = function (id, cb) {
    var query = { _id : id };
    BeerModel.findOne(query, function (err, beer) {
        cb(err, beer);
    })
};

exports.list = function (req, res, next) {
    BeerModel.find({}, function (err, beers) {
        if (err)
            return next(err);

        return res.render('beer/index', { beers : beers })
    })
};

exports.new = function (req, res, next) {
    return res.render('beer/new');
};

exports.show = function (req, res, next) {
    _findById(req.params.id, function (err, beer) {
        if (err)
            return next(err);

        return res.render('beer/show', { beer : beer });
    })
};

exports.edit = function (req, res, next) {
    _findById(req.params.id, function (err, beer) {
        if (err)
            return next(err);

        return res.render('beer/edit', { beer : beer });
    })
};

exports.create = function (req, res, next) {
    var beer = new BeerModel(req.body);
    beer.save(function (err, data) {
        if (err)
            return next(err);

        return res.redirect('beer/' + data._id);
    });
};

exports.update = function (req, res, next) {
    var query = { _id : req.body._id };
    var mod = req.body;
    delete mod._id;
    BeerModel.update(query, mod, function (err, data) {
        if (err)
            return next(err);

        res.redirect('beer/' + query._id);
    });
};

exports.delete = function (req, res, next) {
    var query = { _id : req.params.id };
    BeerModel.remove(query, function(err, data) {
        if (err)
            return res.status(500).json(err);

        return res.json({ message : 'Successful' });
    });
};

exports.populate = function (req, res, next) {
    var url = 'http://api.openbeerdatabase.com/v1/beers.json';
    request({
        uri: url,
        method: 'GET'
    }, function (err, response, body) {
        if (err)
            return next(err);

        var list = JSON.parse(body).beers;
        BeerModel.create(list, function (err) {
            if (err)
                return next(err);

            console.log('POPULATE OK');
        });

    })
};
