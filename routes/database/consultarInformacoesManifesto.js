
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const InformacoesManifesto = require('../../models/InformacoesManifesto')

//---consulta a tabela informcoesManifesto, BD---//
module.exports = async (req, res) => {
    var id = ""
    if(!req.params)
    {
        id = req.id

    }else {
        id = req.params.id
    }
    try {
        const info = await InformacoesManifesto.findOne({ cnpj: id })
        if (!req.params) {
            return info;
        } else {
            if (!info) {
                res.status(422).json({ message: 'Usuário não encontrado!' })
                return
            }
            res.status(200).json(info)
        }       
    } catch (error) {
        console.log(error)
    }
}