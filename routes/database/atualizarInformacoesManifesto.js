
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const InformacoesManifesto = require('../../models/InformacoesManifesto')

//---atualizar a tabela informacoesManifesto, DB---//
module.exports =  async (req, res) => {
  var idValor = ""
  var sequencialValor = ""
  var ultNsuValor = ""
  var lastJobRunValor = ""
  var info = ""
  var valorCnpj = ""
  if (!req.params) {
    idValor = req.id
    lastJobRunValor = req.lastJobRun
    valorCnpj = req.cnpjUsuario
    sequencialValor =  null;
    ultNsuValor = null;
  } else {
    idValor = req.params.id; // acertar é cnpj
    sequencialValor = req.body.payload.sequencial ? req.body.payload.sequencial : null;
    ultNsuValor = req.body.payload.ultNsu ? req.body.payload.ultNsu : null;
    valorCnpj = req.body.payload.cnpjUsuario ? req.body.payload.cnpjUsuario : null;
  }

  if (!req.params) {
     info = {
      'lastJobRun': lastJobRunValor
    }
  } else {

    if (sequencialValor !== null && ultNsuValor !== null) {
      info = {
        'sequencial': sequencialValor,
        'ultNsu': ultNsuValor
      };
    } else if (sequencialValor !== null) {
      info = {
        'sequencial': sequencialValor
      };
    } else if (ultNsuValor !== null) {
      info = {
        'ultNsu': ultNsuValor
      };
    }
  }
  try {
    const updatedInfo = await InformacoesManifesto.updateMany({ cnpj: idValor }, info);
    /**
    if (updatedInfo.matchedCount === 0) {
      if (lastJobRun) {

        res.status(422).json({ message: 'Usuário não encontrado!' })
        return
      }
    }
     */
    if (!req.params) {
      return info
    } else {
      res.status(200).json(info)
    }
  } catch (error) {
    if (!req.params) {
      return info
    } else {
      res.status(500).json({ erro: error })
    }

  }
}