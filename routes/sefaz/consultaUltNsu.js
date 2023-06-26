const express = require('express');
const fs = require('fs');
const zlib = require('zlib');
const convert = require('xml-js');
const { DistribuicaoDFe, RecepcaoEvento } = require('node-mde');
const forge = require('node-forge');
const consultarNsu = require('../database/consultarNsu');
const adicionarNsu = require('../database/adicionarNsu');

module.exports = async (req, res) => {
  //julio no rota api rm
  //const testeCNPJ = await consultaCnpjTeste("37700472000167")
  var nsuNfe = ""
  var cnpjUsuario = ''
  var nomeCertificado = ''
  var senhaCertificado = ''
  if (req.params) {
    nsuNfe = req.params.nsuNfe;
    cnpjUsuario = req.params.cnpj;
    nomeCertificado = req.params.nomeCertificado;
    senhaCertificado = cnpjUsuario == '17828802000197' ? '20202020' : '35612029'
  } else {
    nsuNfe = req.nsuNfe
    cnpjUsuario = req.cnpj;
    nomeCertificado = req.nomeCertificado;
    senhaCertificado = cnpjUsuario == '17828802000197' ? '20202020' : '35612029'
  }
  try {
    var resposta = []
    const findNsus = await consultarNsu(cnpjUsuario)


    if (findNsus !== null) {
  findNsus.forEach((element) => {
    resposta.push(element.idNsu + "||" + element.cnpj + "||" + element.nome + "||" + element.nfe + "||" + element.valor + "||" + element.tipo + "||" + element.situacao + "||" + element.numero + "||" + element.ie + "||" + element.emissao + "||" + element.manifestado);
  });
    }
    var keyData = ""
    var password = ""
    var encryptedPrivateKey = ""
    var privateKey = ""
    var distribuicao = ""
    if (cnpjUsuario == '17828802000197') {

    distribuicao = new DistribuicaoDFe({
      cert: fs.readFileSync('./uploads/MILENGENHARIA.pfx' ),
      passphrase: senhaCertificado,
      //key: privateKey,
      cnpj: cnpjUsuario,
      cUFAutor: '43',
      tpAmb: '1',
    })
    }
    else {
      keyData = fs.readFileSync('./uploads/key.pem', 'utf8');
      password = '35612029'; // Substituir a senha
      // Descriptografando a chave privada
      encryptedPrivateKey = forge.pki.decryptRsaPrivateKey(keyData, password);
      // Convertendo a chave descriptografada para um formato utilizável
      privateKey = forge.pki.privateKeyToPem(encryptedPrivateKey);
      distribuicao = new DistribuicaoDFe({
      cert: fs.readFileSync('./uploads/cert.pem' ),
      //passphrase: senhaCertificado,
      key: privateKey,
      cnpj: cnpjUsuario,
      cUFAutor: '43',
      tpAmb: '1',
    })
    }
    const consulta = await distribuicao.consultaUltNSU(nsuNfe)
    //const consulta = await distribuicao.consultaUltNSU(nsuNfe)
    const maxNsu = consulta.data.maxNSU
    if (consulta.error) {
      throw new Error(consulta.error)
    }
    //trata res.Xml
    var options = { compact: true };
    var result = convert.xml2json(consulta.resXml, options)

    const objetoResXmlJson = JSON.parse(result)
    // percorrer os objetos docZip
    if (objetoResXmlJson["soap:Envelope"] &&
      objetoResXmlJson["soap:Envelope"]["soap:Body"] &&
      objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"] &&
      objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"] &&
      objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"] &&
      objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["xMotivo"]["_text"] && objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["xMotivo"]["_text"] != 'Documento(s) localizado(s)') {
      resposta.push(objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["xMotivo"]["_text"])
    }
    else {
      for (let i = 0; i < objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"].length; i++) {

        var teste = zlib.unzipSync(Buffer.from(objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"][i]["_text"], 'base64')).toString('utf8');
        var options = { compact: true };
        var result = convert.xml2json(teste, options);
        const objetoTipo = JSON.parse(result)

        if (objetoTipo["resNFe"] !== undefined) {

          const criarNsu = {
            idNsu: objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"][i]["_attributes"]["NSU"],
            cnpj: objetoTipo["resNFe"]["CNPJ"]["_text"],
            nome: objetoTipo["resNFe"]["xNome"]["_text"],
            nfe: objetoTipo["resNFe"]["chNFe"]["_text"],
            valor: objetoTipo["resNFe"]["vNF"]["_text"],
            tipo: objetoTipo["resNFe"]["tpNF"]["_text"],
            situacao: objetoTipo["resNFe"]["cSitNFe"]["_text"],
            numero: objetoTipo["resNFe"]["nProt"]["_text"],
            ie: objetoTipo["resNFe"]["IE"]["_text"],
            emissao: objetoTipo["resNFe"]["dhEmi"]["_text"],
            cnpjUsuario: parseFloat(cnpjUsuario)
          }
          const stringProcurada = objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"][i]["_attributes"]["NSU"]
          const stringExisteNoArray = resposta.some(objeto =>
            objeto.includes(stringProcurada)
          );
          if (!stringExisteNoArray) {

            const testeAdicao = adicionarNsu(criarNsu)
            resposta.push(objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"][i]["_attributes"]["NSU"] + "||" + objetoTipo["resNFe"]["CNPJ"]["_text"] + "||" + objetoTipo["resNFe"]["xNome"]["_text"] + "||" + objetoTipo["resNFe"]["chNFe"]["_text"] + "||" + objetoTipo["resNFe"]["vNF"]["_text"] + "||" + objetoTipo["resNFe"]["tpNF"]["_text"] + "||" + objetoTipo["resNFe"]["cSitNFe"]["_text"] + "||" + objetoTipo["resNFe"]["nProt"]["_text"] + "||" + objetoTipo["resNFe"]["IE"]["_text"] + "||" + objetoTipo["resNFe"]["dhEmi"]["_text"])
          }

        }
      }
    }
    const objeto = {
      resposta: resposta,
      maxNsu: maxNsu
    }
    if (req.params) {
      res.status(200).json(objeto)
    } else {
      return objeto
    }
  } catch (error) {
    console.log(error)
  };
}