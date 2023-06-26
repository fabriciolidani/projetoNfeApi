const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const LoginSchema = new Schema({
  usuario:{
    type: String,
    required: true

  },
  senha:{
    type: String,
    required: true
  },
});

module.exports = mongoose.model('Login', LoginSchema);