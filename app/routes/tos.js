'use strict';

const express = require('express');
let router = express.Router();
let controller = require('../controllers/tos');

router.get('/', controller.index);

module.exports = router;
