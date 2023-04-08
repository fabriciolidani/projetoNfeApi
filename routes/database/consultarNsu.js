
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const Nsu = require('../../models/Nsu')

//---consulta a tabela informcoesManifesto, BD---//
module.exports = async (req, res) => {
  try {
    const resposta = [];
    const info = await Nsu.find();
    if (!info) {
      return null;
    } else {
      for (let i = 0; i < info.length; i++) {
        resposta.push(info[i]._doc);
      }
      if (res) {
        res.status(200).json(resposta)
      } else {
        return resposta;
      }
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};