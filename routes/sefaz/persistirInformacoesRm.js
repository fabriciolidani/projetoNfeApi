const fs = require('fs');
const { DistribuicaoDFe, RecepcaoEvento } = require('node-mde')
const unzipper = require('unzipper');
const express = require('express');
const axios = require('axios');
module.exports = async (req, res) => {
      const url = 'http://DESKTOP-BKAG9MQ:8051/rmsrestdataserver/rest/FinCFODataBR';
    /**
      const params = {
        CODEXTERNO: null,
        CODCOLIGADA: 1,
        CODCFO: "005452"
      };
     */
      const headers = {
        'CODSISTEMA': '1',
        'CODUSUARIO': 'mestre',
        'CODCOLIGADA': '1',
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from('usuario:senha').toString('base64')
      };

      try {
        const response = await axios.post(url, req, { headers });
        return response.data ;
      } catch (error) {
        console.error(error);
        return('Internal Server Error');
      }
}