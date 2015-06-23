/*jslint node: true */

var express = require('express');
var router = express.Router();
var controller = require('../controllers/serie');

router.get('/:id', controller.show);

router.get('/:id/episode/:index', controller.show);

module.exports = router;