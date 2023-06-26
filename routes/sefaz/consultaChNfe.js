const fs = require('fs');
const { DistribuicaoDFe, RecepcaoEvento } = require('node-mde')
const unzipper = require('unzipper');

module.exports = async (req, res) => {
  const chNfe = req.params.chNfe;
  const cnpjUsuario = req.params.cnpjUsuario;

  var keyData = ""
  var password = ""
  var encryptedPrivateKey = ""
  var privateKey = ""
  var distribuicao = ""
  if (cnpjUsuario == '17828802000197') {

    distribuicao = new DistribuicaoDFe({
      cert: fs.readFileSync('./uploads/MILENGENHARIA.pfx' ),
      passphrase: '20202020',
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