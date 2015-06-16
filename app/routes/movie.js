/*jslint node: true */

var express = require('express');
var router = express.Router();
var controller = require('../controllers/movie');

router.get('/', controller.index);

router.get('/:page', controller.index);

router.get('/:id/show', controller.show);

module.exports = router;