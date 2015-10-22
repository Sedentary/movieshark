'use strict';

const express = require('express');
let router = express.Router();
let controller = require('../controllers/movie');

router.get('/:id', controller.show);

module.exports = router;
