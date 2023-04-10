const fs = require('fs');
const { DistribuicaoDFe, RecepcaoEvento } = require('node-mde')
const unzipper = require('unzipper');
const consultaCnpjTeste = require("consultar-cnpj")
const InformacoesManifesto = require('../../models/InformacoesManifesto')
const adicionarNsu = require('../database/adicionarNsu');

module.exports = async (req, res) => {
  const cnpj = req.params.cnpj;
  const data = req.body.cnpj;
  const criarNsu = {
    idNsu:"TESTE",
    cnpj:"TESTE",
    nome:"TESTE",
    nfe:"TESTE",
    valor:"TESTE",
    tipo:"TESTE",
    situacao:"TESTE",
    numero:"TESTE",
    ie:"TESTE",
    emissao:data,
}
  try {
    const testeCNPJ = await consultaCnpjTeste(data)

    const testeAdicaoo = adicionarNsu(criarNsu)
    res.send(testeCNPJ);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
}