'use strict';

const express = require('express');
let router = express.Router();
let controller = require('../controllers/movie');

router.get('/', controller.index);

router.get('/search', controller.search);

router.get('/:page', controller.index);

module.exports = router;
