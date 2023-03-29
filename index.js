const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')

app.use(
  express.urlencoded({
    extended: true
  }),
)
app.use(express.json())
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  app.use(cors());
  next();
});

//rota inicial / endpoint
app.get('/', (req, res) => {
  res.json({ message: "oi Express" })
})


///////////////////////////--SEFAZ--///////////////////////////
const consultaChNFe = require('./routes/sefaz/consultaChNfe');
app.post('/consultaChNFe/:chNfe', consultaChNFe);

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
  app.listen(3000)
})
  .catch((err) => {
    console.log('Inicializando...' + '\n' + 'Não foi possível se conectar ao banco! Erro: ' + err)
  })
