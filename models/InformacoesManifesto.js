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
  }
});

module.exports = mongoose.model('InformacoesManifesto', InformacoesManifestoSchema);