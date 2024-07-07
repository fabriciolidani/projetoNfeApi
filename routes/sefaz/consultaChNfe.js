const fs = require('fs');
const { DistribuicaoDFe, RecepcaoEvento } = require('node-mde')
const unzipper = require('unzipper');
const convert = require('xml-js');
const { DOMParser } = require('xmldom');
const forge = require('node-forge');

module.exports = async (req, res) => {
  const chNfe = req.params.chNfe;
  const cnpjUsuario = req.body.cnpj;
  const nomeCertificado = req.body.nomeCertificado;

  var resposta = [];
  var keyData = ""
  var password = ""
  var objRespostaIncorreta = ""
  var encryptedPrivateKey = ""
  var privateKey = ""
  var distribuicao = ""
  if (cnpjUsuario == '17828802000197') {

    distribuicao = new DistribuicaoDFe({
      pfx: fs.readFileSync('./uploads/MILENGENHARIANOVO.pfx' ),
      passphrase: 'MIL@33442225',
      //key: privateKey,
      cnpj: cnpjUsuario,
      cUFAutor: '43',
      'tpDown': 'X',
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
      'tpDown': 'X',
      tpAmb: '1',
    })
  }
/*
  try {
    const consulta = await distribuicao.consultaChNFe(
      chNfe
    )
    const xmlZip = consulta.data;
    const xmlBuffer = await unzipper.Open.buffer(xmlZip);
    const xml = await xmlBuffer.files[0].buffer.toString('utf8');
    fs.writeFileSync('nfe.xml', xml);
    res.send(xml);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
}
*/

  try {
    if (chNfe.lenght != 44 ) //tamanho da  chNFE
    {
      if (chNfe.length !== 44) { //precisa ter a segunda vez
         objRespostaIncorreta = {
          resposta: resposta
        }
        res.status(200).json(objRespostaIncorreta)

        return; // Encerra a execução do código para evitar que o restante do código seja executado
      }
    }
    const consulta = await distribuicao.consultaChNFe(
      chNfe
    )
    var options = { compact: true };
    var result = convert.xml2json(consulta.resXml, options)
    const objetoResXmlJson = JSON.parse(result)

    const xmlZip = consulta.data;
    if (xmlZip?.xMotivo)
    {
      if (xmlZip.xMotivo.toLowerCase().includes('rejeicao')) {
        objRespostaIncorreta = {
          resposta: xmlZip.xMotivo.toString()
        }
        res.status(200).json(objRespostaIncorreta)
        return
      }
    }
    const resNFe = consulta.data.docZip[0]?.xml;
    var nsu = consulta.data.docZip[0]?.nsu;


    const xml = resNFe


    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    
    const chNFe = xmlDoc.getElementsByTagName('chNFe')[0].textContent;
    const CNPJ = xmlDoc.getElementsByTagName('CNPJ')[0].textContent;
    const xNome = xmlDoc.getElementsByTagName('xNome')[0].textContent;
    const IE = xmlDoc.getElementsByTagName('IE')[0].textContent;
    const dhEmi = xmlDoc.getElementsByTagName('dhEmi')[0].textContent;
    const tpNF = xmlDoc.getElementsByTagName('tpNF')[0].textContent;
    const vNF = xmlDoc.getElementsByTagName('vNF')[0].textContent;
    const nProt = xmlDoc.getElementsByTagName('nProt')[0].textContent;
    const cSitNFe = 'Autorizada';
    const manifestado = ""



        resposta.push(nsu + "||" + CNPJ + "||" + xNome + "||" + chNFe + "||" + vNF + "||" + tpNF + "||" + cSitNFe + "||" + nProt  + "||" + IE  + "||" + dhEmi + "||" + 0 )
        const criarNsu = {
            idNsu: nsu,
            cnpj: CNPJ,
            nome: xNome,
            nfe: chNfe,
            valor: vNF,
            tipo: tpNF,
            situacao: cSitNFe,
            numero: nProt,
            ie: IE,
            emissao: dhEmi,
            cnpjUsuario: parseFloat(cnpjUsuario)
        }
        //const stringProcurada = objetoResXmlJson["soap:Envelope"]["soap:Body"]["nfeDistDFeInteresseResponse"]["nfeDistDFeInteresseResult"]["retDistDFeInt"]["loteDistDFeInt"]["docZip"]["_attributes"]["NSU"]
/**
        const stringExisteNoArray = resposta.some(objeto =>
            objeto.includes(stringProcurada)
        );

        const testeAdicao = adicionarNsu(criarNsu)
            const testeQ = "asdsadsa";
        if (!stringExisteNoArray) {
  
        }
*/

const objResposta = {
  resposta: resposta
}
res.status(200).json(objResposta)
} catch (error) {
  console.error(error);
  res.status(500).send(error);
}
}


