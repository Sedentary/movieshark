/*jslint node: true */

var express = require('express');
var router = express.Router();
var controller = require('../controllers/beer');

router.get('/', controller.list);

router.post('/', controller.create);

router.put('/', controller.update);

router.get('/new', controller.new);

router.get('/populate', controller.populate);

router.get('/:id', controller.show);

router.get('/:id/edit', controller.edit);

router.delete('/:id', controller.delete);

module.exports = router;
