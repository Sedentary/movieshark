/*jslint node: true */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BeerSchema = new Schema({
  name : {
    type : String,
    require: true
  },
  description : {
    type : String,
    default : ''
  },
  abv : {
    type : Number,
    min : 0
  }
});

module.exports = mongoose.model('Beer', BeerSchema);
