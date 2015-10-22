'use strict';

const express = require('express');
let router = express.Router();
let controller = require('../controllers/serie');

router.get('/:id', controller.show);

router.get('/:id/season/:season/episode/:episode', controller.show);

module.exports = router;
