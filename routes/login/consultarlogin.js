
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const Login = require('../../models/Login')
const jwt = require('jsonwebtoken')
const SECRET = "SEGREDODEESTADO"
const forge = require('node-forge');
const fs = require('fs');


//---consulta a tabela informcoesManifesto, BD---//
module.exports = async (req, res) => {
  try {
    var valorUsuario = req.body.cnpj;
    var valorSenha = req.body.senha;
    var senhaCertificado = req.body.senhaCertificado;
    var nomeCertificado = req.body.nomeCertificado;

    //if temporario
    var cnpjEhCertDaEntidade = false;
    if (valorUsuario == '17828802000197')
    {
      if (senhaCertificado.includes('2020'))
      {
        cnpjEhCertDaEntidade = true
      }
    }
    if (valorUsuario == '23935237000160')
    {
      if (senhaCertificado.includes('2029'))
      {
        cnpjEhCertDaEntidade = true
      }
    }

    const info = await Login.findOne({ usuario: valorUsuario, senha: valorSenha }).exec();

    if (!info) {
      res.status(200).json({ success: false, error: "Não foi possível realizar o login, usuário ou senha incorretos!" });
    } else {
      const payload = { usuario: valorUsuario }; //O cnpj cadastrado fica no token
      const chaveSecreta = SECRET;
      const opcoes = { expiresIn: 20000 };
      const tokenJWT = jwt.sign(payload, chaveSecreta, opcoes);
      var senhaCerta = ""
      var senhaCertificadoOk = false;

      // Arquivo foi persisistido, testa se existe
      const pfxPath = './uploads/' + nomeCertificado;
      
      var vt = ""
      if (fs.existsSync(pfxPath)) {
        vt ='File path exists:'
      } else {
        vt ='File path does not exist:'
      }
      // Senha a ser verificada
      const password = senhaCertificado;
      // Carrega o conteúdo do arquivo .pfx
      const pfxData = fs.readFileSync(pfxPath, 'binary');

      try {
        // Decodifica o arquivo .pfx
        const p12Asn1 = forge.asn1.fromDer(pfxData);
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
        senhaCerta = "A senha é correta!"
        senhaCertificadoOk = true
      } catch (error) {
        senhaCerta = "A senha do certificado parece estar incorreta! Tente outra senha"
        senhaCertificadoOk = false
        res.status(200).json({ success: false, error: senhaCerta });
        return
      }
      if (senhaCertificadoOk && cnpjEhCertDaEntidade) {
        res.status(200).json({ success: true, jwtToken: tokenJWT });
      } else {
        res.status(200).json({ success: false, error: "Erro inesperado no login, Tente novamente mais tarde" });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(200).json({ success: false, error: "Erro interno do servidor" });
  }
};





