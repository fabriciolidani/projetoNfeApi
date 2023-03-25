/* 
const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const Person = mongoose.model('Person', {
  name: String,
  salary: Number,
  approved: Boolean,
})

module.exports = Person
*/

const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const PersonSchema = new Schema({
  name:{ 
    type: String,
    required: true
    //default: "Teste Sem Valor Preenchido"
  },    
  salary:{ 
    type: Number,
    required: true
  }, 
  approved:{
    type: Boolean,
    required: true
  }
});

module.exports = mongoose.model('Person', PersonSchema);