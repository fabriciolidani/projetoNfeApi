const fs = require('fs');
const { DistribuicaoDFe, RecepcaoEvento } = require('node-mde')
const unzipper = require('unzipper');
const consultaCnpjTeste = require("consultar-cnpj")
const InformacoesManifesto = require('../../models/InformacoesManifesto')
const persistirInformacoesRm = require('../sefaz/persistirInformacoesRm');

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
    const consultaCnpjApi = await consultaCnpjTeste(data)
    const dataAtual = new Date();
    const dataAtualString = dataAtual.toISOString();
    const corpoSaveRecordRm = {
      CODEXTERNO: null,
      CODCOLIGADA: 1,
      CODCFO: "005452",
      CODLOJA: null,
      CODFILIALINTEGRACAO: null,
      NOMEFANTASIA: consultaCnpjApi.estabelecimento.nome_fantasia,
      NOME: consultaCnpjApi.razao_social,
      CGCCFO: consultaCnpjApi.estabelecimento.cnpj,
      INSCRESTADUAL: consultaCnpjApi.estabelecimento.inscricoes_estaduais[0] ? consultaCnpjApi.estabelecimento.inscricoes_estaduais[0] : null,
      PAGREC: 3,
      TIPORUA: 1,
      TIPOBAIRRO: 1,
      RUA: consultaCnpjApi.estabelecimento.logradouro,
      NUMERO: consultaCnpjApi.estabelecimento.numero,
      COMPLEMENTO: consultaCnpjApi.estabelecimento.complemento,
      BAIRRO: consultaCnpjApi.estabelecimento.bairro,
      CIDADE: consultaCnpjApi.estabelecimento.cidade.nome,
      CODETD: "SC",
      CEP: consultaCnpjApi.estabelecimento.cep,
      TELEFONE: consultaCnpjApi.estabelecimento.telefone1,
      FAX: consultaCnpjApi.estabelecimento.fax,
      TELEX: null,
      EMAIL: consultaCnpjApi.estabelecimento.email,
      CONTATO: consultaCnpjApi.estabelecimento.email,
      CODTCF: null,
      ATIVO: 1,
      DATAULTALTERACAO: "2017-04-17T00:00:00-07:00",
      DATACRIACAO: "2004-09-14T00:00:00-07:00",
      USUARIOCRIACAO: "mestre",
      CODUSUARIOACESSO: null,
      RECCREATEDBY: "mestre",
      RECCREATEDON: dataAtualString,
      TELEFONECOMERCIAL: consultaCnpjApi.estabelecimento.telefone1,
      PESSOAFISOUJUR:"J"
   }

    const saveRecordRm = await persistirInformacoesRm(corpoSaveRecordRm);
    //const testeAdicaoo = adicionarNsu(criarNsu)
    res.send(consultaCnpjApi);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
}