const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const schedule = require('node-schedule');
const executarJob = require('./routes/jobs/jobs'); // caminho para o arquivo jobs.js
const InformacoesManifesto = require('./models/InformacoesManifesto')
const Login = require('./models/Login')
const Nsu = require('./models/Nsu')
const jwt = require('jsonwebtoken')
const SECRET = "SEGREDODEESTADO"
const multer = require('multer');
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    // Obtém o nome original do arquivo
    const originalName = file.originalname;
    
    // Define o nome do arquivo com a extensão .pfx
    //const filename = originalName.split('.').slice(0, -1).join('.') + '.pfx';

    cb(null, originalName);
  }
});

const upload = multer({ storage: storage });

/*
async function atualizarMaxNsuDatabase() {
  const maxIdNsu = await Nsu.find().sort({ idNsu: -1 }).limit(1).exec();
  const maxNsu = maxIdNsu[0].idNsu;
  await InformacoesManifesto.updateOne({}, { maxNsuDatabase: maxNsu }).exec();
  //console.log("Atualizando campo maxNsuDatabase")
}
*/

async function atualizarMaxNsuDatabase() {
  try {
    const logins = await Login.find().exec();

    for (const login of logins) {
      const maxIdNsu = await Nsu.find({ cnpjUsuario: login.usuario }).sort({ idNsu: -1 }).limit(1).exec();
      const maxNsu = maxIdNsu[0].idNsu;

      await InformacoesManifesto.updateOne({ cnpj: login.usuario }, { maxNsuDatabase: maxNsu }).exec();
    }

    console.log("Atualização concluída: maxNsuDatabase atualizado para todos os logins.");
  } catch (error) {
    console.error("Ocorreu um erro ao atualizar maxNsuDatabase:", error);
  }
}

executarJob();
setInterval(atualizarMaxNsuDatabase, 60000); // atualiza a cada 10 segundos

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());


function verifyJWT(req, res, next){
  const token = req.headers['x-access-token'];
  if (!token) return res.status(200).json({ auth: false, message: 'Sessão expirada, você será redirecionado para a tela de Login' });

  jwt.verify(token, SECRET, function(err, decoded) {
    if (err) return res.status(200).json({ auth: false, message: 'Sessão expirada, você será redirecionado para a tela de Login' });

    // se tudo estiver ok, salva no request para uso posterior
    req.userId = decoded.id;
    next();
  });
}

///////////////////////////--LOGIN--///////////////////////////

const login =
require('./routes/login/consultarlogin');
app.post('/consultarLogin', upload.single('certificado'), login);

///////////////////////////--APICNPJ--/////////////////////////
const consultaCNPJ = require('./routes/sefaz/consultaCNPJ');
app.post('/consultaCNPJ', consultaCNPJ);

///////////////////////////--SEFAZ--///////////////////////////
const consultaChNFe = require('./routes/sefaz/consultaChNfe');
app.post('/consultaChNFe/:chNfe',verifyJWT, consultaChNFe);

const persistirInformacoesRm = require('./routes/sefaz/persistirInformacoesRm');
app.post('/persistirInformacoesRm/:corpoSaveRecordRm', persistirInformacoesRm);

const manifestarNFE = require('./routes/sefaz/manifestarNfe');
app.post('/manifestarNFE/:valoresSelecionados',verifyJWT, manifestarNFE);

const consultaUltNSU = require('./routes/sefaz/consultaUltNsu');
app.post('/consultaUltNSU/:nsuNfe',verifyJWT, consultaUltNSU);

const consultaNSU = require('./routes/sefaz/consultaNsu');
app.post('/consultaNSU/:nsu',verifyJWT, consultaNSU);


///////////////////////////--DATABASE--///////////////////////////
const consultarInformacoesManifesto = require('./routes/database/consultarInformacoesManifesto');
app.get('/informacoesManifesto/:id', consultarInformacoesManifesto);

const atualizarInformacoesManifesto = require('./routes/database/atualizarInformacoesManifesto');
app.patch('/informacoesManifesto/:id', atualizarInformacoesManifesto);

const consultarNsuDatabase = require('./routes/database/consultarNsu');
app.get('/consultarNsuDatabase', verifyJWT, consultarNsuDatabase);

//rota inicial / endpoint
app.get('/', verifyJWT, (req, res) => {
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
