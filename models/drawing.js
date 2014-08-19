var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our drawing model
var drawingSchema = mongoose.Schema({

    drawing : {
      key : String,
      data : String,
      email : String 
    }

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Drawing', drawingSchema);