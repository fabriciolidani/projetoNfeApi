//const http = require('../../http');
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
const forge = require('node-forge');
const sftp = new SftpClient();
const atualizarNsu = require('../database/atualizarNsu');

//---MANIFESTARNFE API SEFAZ---//

module.exports = async (req, res) => {
  const valoresSelecionados = req.params.valoresSelecionados;
  const sequencial = parseInt(req.body.payload.sequencial);
  const tipoManifestacao = parseInt(req.body.payload.tipoManifestacao);
  var token = parseInt(req.body.payload.token);
  var cnpjUsuario = req.body.payload.cnpjUsuario;
  const valores = [];
  var files = [];
  valoresSelecionados.split(',').forEach(part => {
    valores.push(part);
  });
  //valores.push('43230332451006000252550030000055621588282224');

  var keyData = ""
  var password = ""
  var encryptedPrivateKey = ""
  var privateKey = ""
  var distribuicao = ""
  var valorHostFtp = ""
  var valorPortFtp = ""
  var valorUsernameFtp = ""
  var valorPasswordFtp = ""

  if (cnpjUsuario == '17828802000197') //MilEngenharia
  {
    valorHostFtp = 'michelrocha153211.rm.cloudtotvs.com.br',
    valorPortFtp = 2323,
    valorUsernameFtp = 'ftp_prod_C3JP5M',
    valorPasswordFtp = 'd88ZCaSOvyChja0U4alD'
  }
  else {
    valorHostFtp = 'voatelecomunicacoes120049.rm.cloudtotvs.com.br',
    valorPortFtp = 2323,
    valorUsernameFtp = 'ftp_prod_C1TCZX',
    valorPasswordFtp = 'p3wMCDjSjpeQn9tqmgLWHrAy'
  }


  if (cnpjUsuario == '17828802000197') {
    //DISTRIBUICAO
    distribuicao = new DistribuicaoDFe({
      pfx: fs.readFileSync('./uploads/MILENGENHARIANOVO.pfx'),
      passphrase: 'MIL@33442225',
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
      cert: fs.readFileSync('./uploads/cert.pem'),
      //passphrase: senhaCertificado,
      key: privateKey,
      cnpj: cnpjUsuario,
      cUFAutor: '43',
      tpAmb: '1',
    })
  }
  // envia evento de manifestação
  try {
    const lote = []
    valores.forEach(nsu => {
      lote.push({
        chNFe: nsu,
        tipoEvento: tipoManifestacao == 1 ? 210210 : 210200, //210210 - Ciencia da Operacao | 210200 - Confirmacao da Operacao
      })
    });

    //RECEPCAO
    var recepcao = ""
    if (cnpjUsuario == '17828802000197') {
      recepcao = new RecepcaoEvento({
        pfx: fs.readFileSync('./uploads/MILENGENHARIANOVO.pfx'),
        passphrase: 'MIL@33442225',
        cnpj: '17828802000197',
        tpAmb: '1',
      })
    }
    else {
      recepcao = new RecepcaoEvento({
        cert: fs.readFileSync('./uploads/cert.pem'),
        key: privateKey,
        cnpj: cnpjUsuario,
        tpAmb: '1',
      })

    }

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
              host: valorHostFtp,
              port: valorPortFtp,
              username: valorUsernameFtp,
              password: valorPasswordFtp
            };
            const sftp = new SftpClient();
            try {
              await sftp.connect(config);
              await Promise.all(files.map(async (file) => {
                await sftp.put(Buffer.from(file.content), file.remote);
              }));
              console.log('Arquivos enviados com sucesso!');
            } catch (err) {
              console.error(err.message);
            } finally {
              sftp.end();
            }
          }
          enviarArquivo();

          if (arquivosXml.length >= 1 || xMotivo) {
            nfesManifestadas.forEach(element => {
              var atualizarNsus = atualizarNsu({ id: element })
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
