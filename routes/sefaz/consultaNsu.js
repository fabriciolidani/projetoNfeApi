const express = require('express');
const fs = require('fs');
const zlib = require('zlib');
const convert = require('xml-js');
const { DistribuicaoDFe, RecepcaoEvento } = require('node-mde');
const adicionarNsu = require('../database/adicionarNsu');
const consultarNsu = require('../database/consultarNsu');

//---consulta NSU API SEFAZ---//
module.exports = async (req, res) => {
    var tipo = req.body.tipo;
    console.log(tipo)
    const nsu = req.body.nsu;
    console.log(nsu)
    try {
        const distribuicao = new DistribuicaoDFe({
            pfx: fs.readFileSync('./arquivos/MILENGENHARIA.pfx'),
            passphrase: '20202020',
            cnpj: '17828802000197',
            cUFAutor: '43',
            tpAmb: '1',
        })

        const consulta = await distribuicao.consultaNSU(nsu)

        if (consulta.error) {
            throw new Error(consulta.error)
        }
        //trata res.xml
        var options = { compact: true };
        var result = convert.xml2json(consulta.resXml, options)

        const objetoResXmlJson = JSON.parse(result)

        // percorrer os objetos docZip
        var resposta = []

        if (objetoResXmlJson["soap:Envelope"] &&
            objetoResXmlJson["soap:Envelope"]["soap:Body"] &&
            objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"] &&
            objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"] &&
            objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"] &&
            objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["xMotivo"]["_text"] && objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["xMotivo"]["_text"] == 'Nenhum documento localizado') {
            resposta.push(objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["xMotivo"]["_text"])
        }
        else if (objetoResXmlJson["soap:Envelope"] &&
            objetoResXmlJson["soap:Envelope"]["soap:Body"] &&
            objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"] &&
            objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"] &&
            objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"] &&
            objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["xMotivo"]["_text"] && objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["xMotivo"]["_text"] != 'Documento localizado') {
            resposta.push(objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["xMotivo"]["_text"])
        }
        else {
            for (let i = 0; i < 1; i++) {
                const resNFe = consulta.data.docZip[0]?.xml;

                if (objetoResXmlJson &&
                    objetoResXmlJson["soap:Envelope"] &&
                    objetoResXmlJson["soap:Envelope"]["soap:Body"] &&
                    objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"] &&
                    objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"] &&
                    objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"] &&
                    objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"] &&
                    objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"] &&
                    objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"]["_text"]) {

                    // A tag "docZip" existe, então podemos acessar seu valor
                    const teste = zlib.unzipSync(Buffer.from(objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"]["_text"], 'base64')).toString('utf8');

                    var options = { compact: true };
                    var result = convert.xml2json(teste, options);

                    const objetoTipo = JSON.parse(result)
                    console.log(objetoTipo)
                    console.log(objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"])
                    if (objetoTipo["resNFe"] !== undefined) {
                        resposta.push(objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"]["_attributes"]["NSU"] + "||" + objetoTipo["resNFe"]["CNPJ"]["_text"] + "||" + objetoTipo["resNFe"]["xNome"]["_text"] + "||" + objetoTipo["resNFe"]["chNFe"]["_text"] + "||" + objetoTipo["resNFe"]["vNF"]["_text"] + "||" + objetoTipo["resNFe"]["tpNF"]["_text"] + "||" + objetoTipo["resNFe"]["cSitNFe"]["_text"] + "||" + objetoTipo["resNFe"]["nProt"]["_text"] + "||" + objetoTipo["resNFe"]["IE"]["_text"] + "||" + objetoTipo["resNFe"]["dhEmi"]["_text"])
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
                        const stringProcurada = objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"]["_attributes"]["NSU"]
                        const stringExisteNoArray = resposta.some(objeto =>
                            objeto.includes(stringProcurada)
                        );
                        if (!stringExisteNoArray) {
                            const testeAdicao = adicionarNsu(criarNsu)
                            const testeQ = "asdsadsa";
                        }
                    }
                }
            }
        }
        if (tipo == '1'){
            const findNsus = await consultarNsu()

            findNsus.forEach(element => {
                if (element.idNsu > nsu) {
                    resposta.push(element.idNsu + "||" + element.cnpj + "||" + element.nome + "||" + element.nfe + "||" + element.valor + "||" + element.tipo + "||" + element.situacao + "||" + element.numero + "||" + element.ie + "||" + element.emissao + "||" + element.manifestado)
                }
            });
    }
        const objResposta = {
            resposta: resposta
        }
        console.log(objResposta);
        console.log("responde");
        console.log(tipo);
        res.status(200).json(objResposta)
    } catch (error) {
        console.log(error)
    };
}