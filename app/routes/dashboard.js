/*jslint node: true */

var express = require('express');
var router = express.Router();
var controller = require('../controllers/dashboard');

router.get('/', controller.index);

router.get('/search', controller.search);

router.get('/:page', controller.index);

module.exports = router;