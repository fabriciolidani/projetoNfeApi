const http = require('../../http');
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const convert = require('xml-js');
const InformacoesManifesto = require('../../models/InformacoesManifesto')
const axios = require('axios');
const unzipper = require('unzipper');
const { DistribuicaoDFe, RecepcaoEvento } = require('node-mde')
const fs = require('fs')
const zlib = require('zlib');
const { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser");
const SftpClient = require('ssh2-sftp-client');
const sftp = new SftpClient();
const atualizarNsu = require('../database/atualizarNsu');

//---MANIFESTARNFE API SEFAZ---//

module.exports = async (req, res) => {
  const valoresSelecionados = req.params.valoresSelecionados;
  const sequencial = parseInt(req.body.payload.sequencial);
  const valores = [];
  var files = [];
  valoresSelecionados.split(',').forEach(part => {
    valores.push(part);
  });
  //valores.push('43230332451006000252550030000055621588282224');
  
  const distribuicao = new DistribuicaoDFe({
    pfx: fs.readFileSync('./arquivos/MILENGENHARIA.pfx'),
    passphrase: '20202020',
    cnpj: '17828802000197',
    cUFAutor: '43',
    tpAmb: '1',
  })
  // envia evento de manifestação
  try {
    const lote = []
    valores.forEach(nsu => {
      lote.push({
        chNFe: nsu,
        tipoEvento: 210210,
      })
    });
    const recepcao = new RecepcaoEvento({
      pfx: fs.readFileSync('./arquivos/MILENGENHARIA.pfx'),
      passphrase: '20202020',
      cnpj: '17828802000197',
      tpAmb: '1',
    })
    const manifestacao = await recepcao.enviarEvento({
      idLote: '2',
      lote: lote,
    })
    if (manifestacao.error) {
      throw new Error(manifestacao.error)
    }
    // trata res.xml
    var options = { compact: true };
    var result = convert.xml2json(manifestacao.resXml, options)
    const objetoResXmlJson = JSON.parse(result)
    var qtdEventos = 0;
  
    if (lote.length == 1484866) {
      console.log("teste")
    } else if (lote.length > 0) {
      var xMotivo = '';
      if (lote.length == 1) {
        xMotivo = objetoResXmlJson['soap:Envelope']['soap:Body']['nfeRecepcaoEventoNFResult']['retEnvEvento']['retEvento']['infEvento']['xMotivo']["_text"];
      } else {
        const eventos = objetoResXmlJson['soap:Envelope']['soap:Body']['nfeRecepcaoEventoNFResult']['retEnvEvento']['retEvento'];
  
        eventos.forEach((evento) => {
          xMotivo = xMotivo + '\n' + 'NFE: ' + evento.infEvento.chNFe['_text'] + "    -->" + evento.infEvento.xMotivo['_text'];
          qtdEventos = qtdEventos + 1;
        });
      }
      // consultando notas completas
      let resultadosNfeCompleta = ''
      var arquivosXml = []
      var nfesManifestadas = []
      var contadorAleatorio = sequencial;
      Promise.all(valores.map(async (element) => {
        try {
          const consulta = await distribuicao.consultaChNFe(element)
          const resNFe = consulta.data.docZip[0]?.xml; //procNfe
          contadorAleatorio = parseInt(contadorAleatorio) + 1

          if (resNFe && resNFe.includes('<nfeProc')) {
            resultadosNfeCompleta = resultadosNfeCompleta + "||" + resNFe
            arquivosXml.push(resNFe)

            files.push({
              content: resNFe,
              remote: '/XML/IN/109_' + contadorAleatorio + '.xml'
            })

            nfesManifestadas.push(element)
          }
        } catch (error) {
          console.error(error);
        }
      }))
        .then(() => {
          async function enviarArquivo() {
            const config = {
              host: 'michelrocha111630.rm.cloudtotvs.com.br',
              port: 2323,
              username: 'ftp_prod_C3JP5M',
              password: 'B4vqXSHkizVTDDX7FylC9y2o'
            };
  
            sftp.connect({
              host: 'michelrocha111630.rm.cloudtotvs.com.br',
              port: 2323,
              username: 'ftp_prod_C3JP5M',
              password: 'B4vqXSHkizVTDDX7FylC9y2o'
            }).then(() => {
              return Promise.all(files.map(file => {
                const localPath = `./${Math.random().toString(36).substring(7)}.xml`;
                return new Promise((resolve, reject) => {
                  fs.writeFile(localPath, file.content, err => {
                    if (err) reject(err);
                    resolve(localPath);
                  });
                }).then(localPath => {
                  return sftp.put(localPath, file.remote).then(() => {
                    fs.unlinkSync(localPath);
                  });
                });
              }));
            }).then(() => {
              console.log('Arquivos enviados com sucesso!');
              sftp.end();
            }).catch((err) => {
              console.error(err.message);
              sftp.end();
            });
          }
          enviarArquivo();

          if (arquivosXml.length >= 1) {
            nfesManifestadas.forEach(element => {
              var atualizarNsus = atualizarNsu({id:element})
            });

            arquivosXml.push('respostaEventos' + xMotivo);
            res.status(200).json(arquivosXml)
          } else {

            res.status(210).json('Consumo Indevido! você efetuou 20 manifestações e ou consultas no período de uma hora. Tente novamente mais tarde')
          }
        })
        .catch(error => console.error(error));
    } else {
      res.status(210).json('Consumo Indevido! você efetuou 20 manifestações e ou consultas no período de uma hora. Tente novamente mais tarde NOVO')
    }
  } catch (error) {
    console.log(error)
  }
}
