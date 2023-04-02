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
  rule.minute = [0,15,30,45];
  rule.second = 0;
  rule.hour = new schedule.Range(0, 23);

  // Agende o job de acordo com a regra de agendamento criada
  const job = schedule.scheduleJob(rule, async function () {
    const informacoesManifesto = await consultarInformacoesManifesto({ id: '6417ae15ca08c5eedc2482d6' })
    let lastNsuDatabase = informacoesManifesto ? informacoesManifesto.maxNsuDatabase : null;
    let lastJobRun = informacoesManifesto ? informacoesManifesto.lastJobRun : null;
    if (lastJobRun !== null) {
      stringDoBanco = lastJobRun
      dataDoBanco = new Date(stringDoBanco);
      now = new Date();
      diferencaEmMilissegundos = now - dataDoBanco;
      diferencaEsperadaEmMilissegundos = 3900000; // 01 hora e 05 minutos em milisegundos
      diferencaEhIgualOuMaior = diferencaEmMilissegundos >= diferencaEsperadaEmMilissegundos;

      if (diferencaEhIgualOuMaior)
      {
      if (lastNsuDatabase != null) {
        const consultaUltNsu = await consultaUltimaNsu({ nsuNfe: lastNsuDatabase })
        var a = await updateDatabase({ id: '6417ae15ca08c5eedc2482d6', lastJobRun: now })
      }
      }
    }
    console.log(diferencaEmMilissegundos)
    console.log(diferencaEhIgualOuMaior)
    console.log(now.toString());
    console.log('Executando o job...');
  })
};

