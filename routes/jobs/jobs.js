const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const InformacoesManifesto = require('../../models/InformacoesManifesto')
const consultarInformacoesManifesto = require('../database/consultarInformacoesManifesto')
const consultaUltimaNsu = require('../sefaz/consultaUltNsu')
const updateDatabase = require('../database/atualizarInformacoesManifesto')

module.exports = async () => {
  const schedule = require('node-schedule');
  var now = ""
  var stringDoBanco = "";
  var dataDoBanco = ""
  var diferencaEmMilissegundos = ""
  var diferencaEsperadaEmMilissegundos = ""
  var diferencaEhIgualOuMaior = ""

  // Cria uma regra de agendamento que executa o job a cada minuto, durante todo o dia
  const rule = new schedule.RecurrenceRule();
  rule.minute = [13];
  rule.second = 0;
  rule.hour = new schedule.Range(0, 23);

  // Agende o job de acordo com a regra de agendamento criada
  const job = schedule.scheduleJob(rule, async function () {
    const listaUsuarios = ['17828802000197'] //adiconar aqui no _id do usuario
    var cnpjUsuario = '';
    var nomeCertificado = '';
    for (const usuarioId of listaUsuarios) {
      const informacoesManifesto = await consultarInformacoesManifesto({ id: usuarioId });
      let lastNsuDatabase = informacoesManifesto ? informacoesManifesto.maxNsuDatabase : null;
      let lastJobRun = informacoesManifesto ? informacoesManifesto.lastJobRun : null;
      if (lastJobRun !== null) {
        stringDoBanco = lastJobRun
        dataDoBanco = new Date(stringDoBanco);
        now = new Date();
        diferencaEmMilissegundos = now - dataDoBanco;
        diferencaEsperadaEmMilissegundos = 3900000; // 01 hora e 05 minutos em milisegundos
        diferencaEhIgualOuMaior = diferencaEmMilissegundos >= diferencaEsperadaEmMilissegundos;

       if (diferencaEhIgualOuMaior) {
          if (lastNsuDatabase != null) {
            if (usuarioId == '17828802000197') {
               cnpjUsuario = '17828802000197';
               nomeCertificado = 'MILENGENHARIANOVO.pfx';
            } else {
               cnpjUsuario = '23935237000160';
               nomeCertificado = 'VOA TELECOMUNICACOES LTDA (2).pfx';
            }
            const consultaUltNsu = await consultaUltimaNsu({ nsuNfe: lastNsuDatabase ,cnpj: cnpjUsuario, nomeCertificado: nomeCertificado})
            var a = await updateDatabase({ id: usuarioId /*CNPJ*/, lastJobRun: now, cnpj: cnpjUsuario })
      }
    }
     }
      console.log(diferencaEmMilissegundos)
      console.log(now.toString());
      console.log('Tentativa de realizar job por tempo realizada - ' + 'Status Tentativa: ' + diferencaEhIgualOuMaior);
    }
  })
};

