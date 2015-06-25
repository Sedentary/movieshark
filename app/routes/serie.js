/*jslint node: true */

var express = require('express');
var router = express.Router();
var controller = require('../controllers/serie');

router.get('/:id', controller.show);

router.get('/:id/season/:season/episode/:episode', controller.show);

module.exports = router;