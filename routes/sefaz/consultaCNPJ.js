const fs = require('fs');
const { DistribuicaoDFe, RecepcaoEvento } = require('node-mde')
const unzipper = require('unzipper');
const consultaCnpjTeste = require("consultar-cnpj")
const InformacoesManifesto = require('../../models/InformacoesManifesto')
const persistirInformacoesRm = require('../sefaz/persistirInformacoesRm');

module.exports = async (req, res) => {
  var corpoSaveRecordRm = ""
  var retornaSuframa = ""
  const cnpj = req.body.cnpj; // CNPJ no formato com pontos, barras e traços
  // Removendo pontos, barras e traços do CNPJ
  const data = cnpj.replace(/[./-]/g, '');
  //const data = req.body.cnpj;
  async function consultarSuframa(data, inscricao) {

        const empresa0 = await consultaCnpjTeste.suframa(data, inscricao)
        return empresa0

  }
  console.log(data)
  const criarNsu = {
    idNsu: "TESTE",
    cnpj: "TESTE",
    nome: "TESTE",
    nfe: "TESTE",
    valor: "TESTE",
    tipo: "TESTE",
    situacao: "TESTE",
    numero: "TESTE",
    ie: "TESTE",
    emissao: data,
  }
  try {
    const consultaCnpjApi = await consultaCnpjTeste(data)
    if (consultaCnpjApi.estabelecimento.inscricoes_estaduais[0]) {
      retornaSuframa = await consultarSuframa(data, consultaCnpjApi.estabelecimento.inscricoes_estaduais[0].inscricao_estadual)
      console.log("Passou pra buscar suframa, tem inscricao")
      console.log(retornaSuframa)
      var inscricaoSuframaRetornada = retornaSuframa.inscricao_suframa
    }

    const dataAtual = new Date();
    const dataAtualString = dataAtual.toISOString();
    var codMunicipioCorreto = ""

    const codMunicipioOriginal = consultaCnpjApi.estabelecimento.cidade.ibge_id
    const novaString = codMunicipioOriginal.toString().slice(2) // remove as duas primeiras posições
    if ( novaString < 5) {
      codMunicipioCorreto = String(novaString).padStart(5, '0');
    } else {
      codMunicipioCorreto = novaString
    }

    if (retornaSuframa != "" && retornaSuframa != "suframa inexistente") {
      corpoSaveRecordRm = {
        CODEXTERNO: null,
        CODCOLIGADA: 1,
        CODCFO: "005452",
        CODLOJA: null,
        CODFILIALINTEGRACAO: null,
        NOMEFANTASIA: consultaCnpjApi.estabelecimento.nome_fantasia ? consultaCnpjApi.estabelecimento.nome_fantasia : consultaCnpjApi.razao_social,
        NOME: consultaCnpjApi.razao_social,
        CGCCFO: consultaCnpjApi.estabelecimento.cnpj,
        INSCRESTADUAL: consultaCnpjApi.estabelecimento.inscricoes_estaduais[0] ? consultaCnpjApi.estabelecimento.inscricoes_estaduais[0].inscricao_estadual : null,
        PAGREC: 3,
        TIPORUA: 1,
        TIPOBAIRRO: 1,
        RUA: consultaCnpjApi.estabelecimento.logradouro,
        NUMERO: consultaCnpjApi.estabelecimento.numero,
        COMPLEMENTO: consultaCnpjApi.estabelecimento.complemento,
        BAIRRO: consultaCnpjApi.estabelecimento.bairro,
        CIDADE: consultaCnpjApi.estabelecimento.cidade.nome,
        CODMUNICIPIO: codMunicipioCorreto,
        CODETD: consultaCnpjApi.estabelecimento.estado.sigla,
        CEP: consultaCnpjApi.estabelecimento.cep,
        TELEFONE: consultaCnpjApi.estabelecimento.telefone1,
        FAX: consultaCnpjApi.estabelecimento.fax,
        TELEX: null,
        EMAIL: consultaCnpjApi.estabelecimento.email,
        CONTATO: consultaCnpjApi.estabelecimento.email,
        CODTCF: null,
        ATIVO: 1,
        DATAULTALTERACAO: dataAtualString,
        DATACRIACAO: dataAtualString,
        USUARIOCRIACAO: "mestre",
        CODUSUARIOACESSO: null,
        RECCREATEDBY: "mestre",
        RECCREATEDON: dataAtualString,
        TELEFONECOMERCIAL: consultaCnpjApi.estabelecimento.telefone1,
        PESSOAFISOUJUR: "J",
        FCFOCOMPL: [
          {
            CODCOLIGADA: 1,
            CODCFO: "005452",
            RECCREATEDBY: "mestre",
            RECCREATEDON: dataAtualString,
            //RECMODIFIEDBY:null,
            //RECMODIFIEDON:dataAtualString,
            ATIVO_SUFRAMA: retornaSuframa.ativo ? 1 : 0,
            INSCRICAO_SUFRAMA: retornaSuframa.inscricao_suframa ? retornaSuframa.inscricao_suframa : null,
          }
        ]
        //ATIVO_SUFRAMA: retornaSuframa.inscricao_suframa ? 1 : 0,
        //INSCRICAO_SUFRAMA:retornaSuframa.inscricao_suframa ? retornaSuframa.inscricao_suframa : null,
      }
    } else {
      corpoSaveRecordRm = {
        CODEXTERNO: null,
        CODCOLIGADA: 1,
        CODCFO: "005452",
        CODLOJA: null,
        CODFILIALINTEGRACAO: null,
        NOMEFANTASIA: consultaCnpjApi.estabelecimento.nome_fantasia ? consultaCnpjApi.estabelecimento.nome_fantasia : consultaCnpjApi.razao_social,
        NOME: consultaCnpjApi.razao_social,
        CGCCFO: consultaCnpjApi.estabelecimento.cnpj,
        INSCRESTADUAL: consultaCnpjApi.estabelecimento.inscricoes_estaduais[0] ? consultaCnpjApi.estabelecimento.inscricoes_estaduais[0].inscricao_estadual : null,
        PAGREC: 3,
        TIPORUA: 1,
        TIPOBAIRRO: 1,
        RUA: consultaCnpjApi.estabelecimento.logradouro,
        NUMERO: consultaCnpjApi.estabelecimento.numero,
        COMPLEMENTO: consultaCnpjApi.estabelecimento.complemento,
        BAIRRO: consultaCnpjApi.estabelecimento.bairro,
        CIDADE: consultaCnpjApi.estabelecimento.cidade.nome,
        CODMUNICIPIO: codMunicipioCorreto,
        CODETD: consultaCnpjApi.estabelecimento.estado.sigla,
        CEP: consultaCnpjApi.estabelecimento.cep,
        TELEFONE: consultaCnpjApi.estabelecimento.telefone1,
        FAX: consultaCnpjApi.estabelecimento.fax,
        TELEX: null,
        EMAIL: consultaCnpjApi.estabelecimento.email,
        CONTATO: consultaCnpjApi.estabelecimento.email,
        CODTCF: null,
        ATIVO: 1,
        DATAULTALTERACAO: dataAtualString,
        DATACRIACAO: dataAtualString,
        USUARIOCRIACAO: "mestre",
        CODUSUARIOACESSO: null,
        RECCREATEDBY: "mestre",
        RECCREATEDON: dataAtualString,
        TELEFONECOMERCIAL: consultaCnpjApi.estabelecimento.telefone1,
        PESSOAFISOUJUR: "J"
      }
    }

    //const saveRecordRm2 = await persistirInformacoesRm(corpoSaveRecordRmSuframa);
    const saveRecordRm = await persistirInformacoesRm(corpoSaveRecordRm);
    res.send("Retorno:" + JSON.stringify(saveRecordRm));
  } catch (error) {
    res.status(500).send("Retorno: " + 'Erro, não foi possível cadastrar esse CNPJ na base de dados, entre em contato com o administrador');
  }
}