const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const NsuSchema = new Schema({
    idNsu: {
        type: String,
        required: true
    },
    cnpj: {
        type: String,
        required: true
    },
    nome: {
        type: String,
        required: true
    },
    nfe: {
        type: String,
        required: true
    },
    valor: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        required: true
    },
    situacao: {
        type: String,
        required: true
    },
    numero: {
        type: String,
        required: true
    },
    ie: {
        type: String,
        required: true
    },
    emissao: {
        type: String,
        required: true
    },
    manifestado: {
        type: String,
        //required: true
    }
});

module.exports = mongoose.model('Nsu', NsuSchema);


