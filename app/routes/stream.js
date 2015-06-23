/*jslint node: true */

var express = require('express');
var router = express.Router();
var controller = require('../controllers/stream');

router.get('/', controller.index);

module.exports = router;