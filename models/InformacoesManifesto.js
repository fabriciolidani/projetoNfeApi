const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const InformacoesManifestoSchema = new Schema({
  sequencial:{
    type: String,
    required: true

  },
  ultNsu:{
    type: String,
    required: true
  },
  maxNsuDatabase:{
    type: String
  },
  lastJobRun:{
    type: String
  }
});

module.exports = mongoose.model('InformacoesManifesto', InformacoesManifestoSchema);