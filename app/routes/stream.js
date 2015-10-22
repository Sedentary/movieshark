'use strict';

const express = require('express');
let router = express.Router();
let controller = require('../controllers/stream');

router.get('/', controller.index);

module.exports = router;
