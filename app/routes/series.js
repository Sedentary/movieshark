/*jslint node: true */

var express = require('express');
var router = express.Router();
var controller = require('../controllers/serie');

router.get('/', controller.index);

router.get('/:page', controller.index);

module.exports = router;