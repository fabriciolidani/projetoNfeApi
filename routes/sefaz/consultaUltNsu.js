const express = require('express');
const fs = require('fs');
const zlib = require('zlib');
const convert = require('xml-js');
const { DistribuicaoDFe, RecepcaoEvento } = require('node-mde');
const consultarNsu = require('../database/consultarNsu');

module.exports = async (req, res) => {
  const nsuNfe = req.params.nsuNfe;
  console.log(nsuNfe)
  try {
    var resposta = []
    const findNsus = await consultarNsu()

    findNsus.forEach(element => {
      resposta.push(element.idNsu + "||" + element.cnpj + "||" + element.nome + "||" + element.nfe + "||" + element.valor + "||" + element.tipo + "||" + element.situacao + "||" + element.numero + "||" + element.ie + "||" + element.emissao)
    });

    const distribuicao = new DistribuicaoDFe({
      pfx: fs.readFileSync('./arquivos/MILENGENHARIA.pfx'),
      passphrase: '20202020',
      cnpj: '17828802000197',
      cUFAutor: '43',
      tpAmb: '1',
    })
    //const consulta = await distribuicao.consultaUltNSU('000000000009530')
    const consulta = await distribuicao.consultaUltNSU('000000000009800')

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
        console.log(objetoTipo)
        console.log("[%o]", objetoTipo);



        if (objetoTipo["resNFe"] !== undefined) {
          resposta.push(objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"][i]["_attributes"]["NSU"] + "||" + objetoTipo["resNFe"]["CNPJ"]["_text"] + "||" + objetoTipo["resNFe"]["xNome"]["_text"] + "||" + objetoTipo["resNFe"]["chNFe"]["_text"] + "||" + objetoTipo["resNFe"]["vNF"]["_text"] + "||" + objetoTipo["resNFe"]["tpNF"]["_text"] + "||" + objetoTipo["resNFe"]["cSitNFe"]["_text"] + "||" + objetoTipo["resNFe"]["nProt"]["_text"] + "||" + objetoTipo["resNFe"]["IE"]["_text"] + "||" + objetoTipo["resNFe"]["dhEmi"]["_text"])
          const criarNsu = {
            idNsu: objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"]["_attributes"]["NSU"],
            cnpj: objetoTipo["resNFe"]["CNPJ"]["_text"],
            nome: objetoTipo["resNFe"]["xNome"]["_text"],
            nfe: objetoTipo["resNFe"]["chNFe"]["_text"],
            valor: objetoTipo["resNFe"]["vNF"]["_text"],
            tipo: objetoTipo["resNFe"]["tpNF"]["_text"],
            situacao: objetoTipo["resNFe"]["cSitNFe"]["_text"],
            numero: objetoTipo["resNFe"]["nProt"]["_text"],
            ie: objetoTipo["resNFe"]["IE"]["_text"],
            emissao: objetoTipo["resNFe"]["dhEmi"]["_text"]
          }
          const stringProcurada = objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"]["_attributes"]["NSU"];
          const stringExisteNoArray = resposta.some(objeto =>
            objeto.includes(stringProcurada)
          );
          if (!stringExisteNoArray) {

            const testeAdicao = adicionarNsu(criarNsu)
          }
        }
      }
    }
    console.log(resposta);
    res.status(200).json(resposta)
  } catch (error) {
    console.log(error)
  };
}