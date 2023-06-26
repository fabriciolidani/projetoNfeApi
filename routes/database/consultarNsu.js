
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const Nsu = require('../../models/Nsu')

//---consulta a tabela informacoesManifesto, BD---//
module.exports = async (req, res) => {
  try {
    var cnpj = '';
    cnpj = req.query && req.query.cnpj ? parseInt(req.query.cnpj) : parseInt(req);


    const info = await Nsu.find({ cnpjUsuario: cnpj }).lean().select('-__v'); // seleciona todos os campos, exceto __v
    if (!info || info.length === 0) {
      return null;
    } else {
      if (res) {
        res.status(200).json(info);
      } else {
        return info;
      }
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};





