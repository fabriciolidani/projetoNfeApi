
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const Nsu = require('../../models/Nsu')

//---atualizar a tabela informacoesManifesto, DB---//
module.exports = async (req, res) => {

    const idNsu = req.idNsu
    const cnpj = req.cnpj
    const nome = req.nome
    const nfe = req.nfe
    const valor = req.valor
    const tipo = req.tipo
    const situacao = req.situacao
    const numero = req.numero
    const ie = req.ie
    const emissao = req.emissao
    const cnpjUsuario = req.cnpjUsuario

    const novaNsu = {
        idNsu,
        cnpj,
        nome,
        nfe,
        valor,
        tipo,
        situacao,
        numero,
        ie,
        emissao,
        cnpjUsuario
    }
    try {
        const testeAd = await Nsu.create(novaNsu)
    } catch (error) {
       const a = "Erro: "
    }
}