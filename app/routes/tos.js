/*jslint node: true */

var express = require('express');
var router = express.Router();
var controller = require('../controllers/tos');

router.get('/', controller.index);

module.exports = router;