
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
//const InformacoesManifesto = require('../../models/InformacoesManifesto')
const Nsu = require('../../models/Nsu')

//---atualizar a tabela Nsu, DB---//
module.exports =  async (req, res) => {
  const nfeValor = req.id;
  const info = {
    'manifestado': 1,
  }
  try {
    const updatedInfo = await Nsu.updateOne({ nfe: nfeValor }, info)
} catch (error) {
    console.log(error)
  }
}