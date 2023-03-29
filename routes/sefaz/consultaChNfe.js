const fs = require('fs');
const { DistribuicaoDFe, RecepcaoEvento } = require('node-mde')
const unzipper = require('unzipper');

module.exports = async (req, res) => {
  const chNfe = req.params.chNfe;
  const distribuicao = new DistribuicaoDFe({
    pfx: fs.readFileSync('../arquivos/MILENGENHARIA.pfx'),
    passphrase: '20202020',
    cnpj: '17828802000197',
    cUFAutor: '43',
    'tpDown': 'X',
    tpAmb: '1',
  })
  try {
    const consulta = await distribuicao.consultaChNFe(
      chNfe
    )
    const xmlZip = consulta.data;
    const xmlBuffer = await unzipper.Open.buffer(xmlZip);
    const xml = await xmlBuffer.files[0].buffer.toString('utf8');
    console.log(xml)
    fs.writeFileSync('nfe.xml', xml);
    res.send(xml);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
}