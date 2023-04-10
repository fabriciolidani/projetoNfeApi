const fs = require('fs');
const { DistribuicaoDFe, RecepcaoEvento } = require('node-mde')
const unzipper = require('unzipper');
const consultaCnpjTeste = require ("consultar-cnpj")

module.exports = async (req, res) => {
  const cnpj = req.params.cnpj;
  const data = req.body.cnpj;

  try {
  const testeCNPJ = await consultaCnpjTeste(data)
    res.send(testeCNPJ);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
}