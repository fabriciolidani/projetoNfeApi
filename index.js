const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const schedule = require('node-schedule');
const executarJob = require('./routes/jobs/jobs'); // caminho para o arquivo jobs.js
const InformacoesManifesto = require('./models/InformacoesManifesto')
const Nsu = require('./models/Nsu')

async function atualizarMaxNsuDatabase() {
  const maxIdNsu = await Nsu.find().sort({ idNsu: -1 }).limit(1).exec();
  const maxNsu = maxIdNsu[0].idNsu;
  await InformacoesManifesto.updateOne({}, { maxNsuDatabase: maxNsu }).exec();
  //console.log("Atualizando campo maxNsuDatabase")
}
executarJob();
setInterval(atualizarMaxNsuDatabase, 10000); // atualiza a cada 10 segundos

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

///////////////////////////--APICNPJ--///////////////////////////
const consultaCNPJ = require('./routes/sefaz/consultaCNPJ');
app.post('/consultaCNPJ/:cnpj', consultaCNPJ);

///////////////////////////--SEFAZ--///////////////////////////
const consultaChNFe = require('./routes/sefaz/consultaChNfe');
app.post('/consultaChNFe/:chNfe', consultaChNFe);


const persistirInformacoesRm = require('./routes/sefaz/persistirInformacoesRm');
app.post('/persistirInformacoesRm/:corpoSaveRecordRm', persistirInformacoesRm);


const manifestarNFE = require('./routes/sefaz/manifestarNfe');
app.post('/manifestarNFE/:valoresSelecionados', manifestarNFE);

const consultaUltNSU = require('./routes/sefaz/consultaUltNsu');
app.post('/consultaUltNSU/:nsuNfe', consultaUltNSU);

const consultaNSU = require('./routes/sefaz/consultaNsu');
app.post('/consultaNSU/:nsu', consultaNSU);

///////////////////////////--DATABASE--///////////////////////////
const consultarInformacoesManifesto = require('./routes/database/consultarInformacoesManifesto');
app.get('/informacoesManifesto/:id', consultarInformacoesManifesto);

const atualizarInformacoesManifesto = require('./routes/database/atualizarInformacoesManifesto');
app.patch('/informacoesManifesto/:id', atualizarInformacoesManifesto);

const consultarNsuDatabase = require('./routes/database/consultarNsu');
app.get('/consultarNsuDatabase', consultarNsuDatabase);

//rota inicial / endpoint
app.get('/', (req, res) => {
  res.json({ message: "oi Express" })
})
// defina um middleware de redirecionamento
app.use((req, res, next) => {
  if (req.originalUrl !== '/') { // verifique se a URL não é a rota inicial
    res.redirect('/'); // redirecione o usuário de volta à rota inicial
  } else {
    next(); // passe o controle para a próxima rota
  }
});

//---MONGO DB entregar porta para disponibilizar/escutar aplicação---//
const dbUri = 'mongodb+srv://fabriciolidani:7ubgCswPWhxDHmbx@apiclusternfe.liy6tgi.mongodb.net/?retryWrites=true&w=majority'

mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // tempo limite de seleção do servidor em milissegundos
  socketTimeoutMS: 45000, // tempo limite do socket em milissegundos
  keepAlive: true, // mantém a conexão viva mesmo quando ociosa
}).then(() => {
  console.log('Inicializando...' + '\n' + 'Conexão com o banco realizada com sucesso!')
  //registerChangeStream(db);
  app.listen(3000)
})
  .catch((err) => {
    console.log('Inicializando...' + '\n' + 'Não foi possível se conectar ao banco! Erro: ' + err)
  })
