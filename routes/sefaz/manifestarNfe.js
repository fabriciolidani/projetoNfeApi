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
      var contadorAleatorio = sequencial;
      Promise.all(valores.map(async (element) => {
        try {
          const consulta = await distribuicao.consultaChNFe(element)
          const resNFe = consulta.data.docZip[0]?.xml;
          contadorAleatorio = parseInt(contadorAleatorio) + 1
  
          /**
          files.push( {
            content: "<nfeProc versao=\"4.00\" xmlns=\"http://www.portalfiscal.inf.br/nfe\"><NFe xmlns=\"http://www.portalfiscal.inf.br/nfe\"><infNFe versao=\"4.00\" Id=\"NFe43230332451006000252550030000055621588282224\"><ide><cUF>43</cUF><cNF>58828222</cNF><natOp>VENDA DE COMBUSTÍVEL OU LUBRIFICANTE ADQUIRIDO OU RECEB</natOp><mod>55</mod><serie>3</serie><nNF>5562</nNF><dhEmi>2023-03-12T08:05:01-03:00</dhEmi><dhSaiEnt>2023-03-12T08:05:01-03:00</dhSaiEnt><tpNF>1</tpNF><idDest>1</idDest><cMunFG>4320909</cMunFG><tpImp>1</tpImp><tpEmis>1</tpEmis><cDV>4</cDV><tpAmb>1</tpAmb><finNFe>1</finNFe><indFinal>1</indFinal><indPres>1</indPres><procEmi>0</procEmi><verProc>8.03.06</verProc></ide><emit><CNPJ>32451006000252</CNPJ><xNome>DANIELI E DANIELI AUTO POSTO LTDA  FILIAL 1</xNome><xFant>AUTO POSTO DANIELI LTDA  FILIAL 1</xFant><enderEmit><xLgr>RODOVIA RS 463 KM 2,380</xLgr><nro>SN</nro><xBairro>LINHA SPAGNOL</xBairro><cMun>4320909</cMun><xMun>TAPEJARA</xMun><UF>RS</UF><CEP>99950000</CEP><cPais>1058</cPais><xPais>Brasil</xPais><fone>05421191999</fone></enderEmit><IE>1380051662</IE><IM>7886</IM><CRT>3</CRT></emit><dest><CNPJ>17828802000197</CNPJ><xNome>MICHEL ROCHA E CIA LTDA EPP</xNome><enderDest><xLgr>RUA MANOEL TEIXEIRA</xLgr><nro>409</nro><xCpl>SALA 02  A</xCpl><xBairro>CENTRO</xBairro><cMun>4320909</cMun><xMun>TAPEJARA</xMun><UF>RS</UF><CEP>99950000</CEP><cPais>1058</cPais><xPais>BRASIL</xPais><fone>05433442309</fone></enderDest><indIEDest>1</indIEDest><IE>1380046448</IE><email>contato@Arquivos/milengenharia.rs;financeiro@Arquivos/milengenharia.rs</email></dest><det nItem=\"1\"><prod><cProd>GC</cProd><cEAN>SEM GTIN</cEAN><xProd>GC  GASOLINA COMUM</xProd><NCM>27101259</NCM><CEST>0600201</CEST><CFOP>5656</CFOP><uCom>LT</uCom><qCom>52.29</qCom><vUnCom>5.37</vUnCom><vProd>280.80</vProd><cEANTrib>SEM GTIN</cEANTrib><uTrib>LT</uTrib><qTrib>52.29</qTrib><vUnTrib>5.37</vUnTrib><indTot>1</indTot><comb><cProdANP>320102001</cProdANP><descANP>GASOLINA C COMUM</descANP><UFCons>RS</UFCons></comb></prod><imposto><ICMS><ICMSST><orig>0</orig><CST>60</CST><vBCSTRet>0.00</vBCSTRet><vICMSSTRet>0.00</vICMSSTRet><vBCSTDest>0.00</vBCSTDest><vICMSSTDest>0.00</vICMSSTDest><pRedBCEfet>0.00</pRedBCEfet><vBCEfet>280.80</vBCEfet><pICMSEfet>17.00</pICMSEfet><vICMSEfet>47.74</vICMSEfet></ICMSST></ICMS><PIS><PISNT><CST>04</CST></PISNT></PIS><COFINS><COFINSNT><CST>04</CST></COFINSNT></COFINS></imposto></det><total><ICMSTot><vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson><vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet><vProd>280.80</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg><vDesc>0.00</vDesc><vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol><vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro><vNF>280.80</vNF></ICMSTot></total><transp><modFrete>9</modFrete></transp><pag><detPag><indPag>0</indPag><tPag>04</tPag><vPag>280.80</vPag></detPag></pag><infAdic><infCpl>Trib aprox R$ 37,77 Fed |  R$ 47,74 Est |  R$ 0,00 Mun | Fonte IBPT(23.1.A) | Caixa: 2658 | Placa: PXQ0B88 | KM: 101627 | Media KM: 35,992 | ECONOMIA DE: R$ 11,50 |</infCpl><obsCont xCampo=\"Sistema\"><xTexto>ARGO SISTEMAS</xTexto></obsCont></infAdic></infNFe><Signature xmlns=\"http://www.w3.org/2000/09/xmldsig#\"><SignedInfo><CanonicalizationMethod Algorithm=\"http://www.w3.org/TR/2001/REC-xml-c14n-20010315\" /><SignatureMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#rsa-sha1\" /><Reference URI=\"#NFe43230332451006000252550030000055621588282224\"><Transforms><Transform Algorithm=\"http://www.w3.org/2000/09/xmldsig#enveloped-signature\" /><Transform Algorithm=\"http://www.w3.org/TR/2001/REC-xml-c14n-20010315\" /></Transforms><DigestMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#sha1\" /><DigestValue>g4XmK5dJZuwQuMPaIdl2hxXEB5Y=</DigestValue></Reference></SignedInfo><SignatureValue>kVTDs4rZkTd2TkrD3nj75KL7O1xawzRcr1oivVySR7VCQ8U07kAq5krEu/lrn/dDVM2hgcPKmeICkXs0SuBUquvFemKmPOI0TRLgEM/cPLgqv8zVWuhOd4wzqlVaAeGUxX441jyb3OjbgmqekiLjDd52hrDOvBw8DCfHlZqbCF8ha96lsEvWGo//fzOQkE0l7ePIl13lKH/0Z0TrFxdkmBgo7j+gQKqKtRqjh83T6+CGSaMISrd7UWko1YoQlL2ewIzdW2UNg5Fju2WbCQ1ycrImRWNbTRn4zahmnCTq8bN7BJzYOrlidcd2lJPFhA473yBmXaX6KnaNHaRdzd+5/A==</SignatureValue><KeyInfo><X509Data><X509Certificate>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</X509Certificate></X509Data></KeyInfo></Signature></NFe><protNFe versao=\"4.00\" xmlns=\"http://www.portalfiscal.inf.br/nfe\"><infProt><tpAmb>1</tpAmb><verAplic>RS202301190912</verAplic><chNFe>43230332451006000252550030000055621588282224</chNFe><dhRecbto>2023-03-12T08:05:02-03:00</dhRecbto><nProt>143230054617693</nProt><digVal>g4XmK5dJZuwQuMPaIdl2hxXEB5Y=</digVal><cStat>100</cStat><xMotivo>Autorizado o uso da NF-e</xMotivo></infProt></protNFe></nfeProc>",
            remote: '/test/109T_' + contadorAleatorio + '.txt'
          })
           */
  
          if (resNFe) {
            resultadosNfeCompleta = resultadosNfeCompleta + "||" + resNFe
            arquivosXml.push(resNFe)
  
            files.push({
              content: resNFe,
              remote: '/XML/IN/109_' + contadorAleatorio + '.xml'
            })
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
