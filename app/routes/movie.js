/*jslint node: true */

var express = require('express');
var router = express.Router();
var controller = require('../controllers/movie');

router.get('/:id', controller.show);

module.exports = router;