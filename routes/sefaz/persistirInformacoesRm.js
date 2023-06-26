const fs = require('fs');
const { DistribuicaoDFe, RecepcaoEvento } = require('node-mde')
const unzipper = require('unzipper');
const express = require('express');
const axios = require('axios');
module.exports = async (req, res) => {
      const url = 'http://10.147.17.73:8051/rmsrestdataserver/rest/FinCFODataBR';
      const headers = {
        'CODSISTEMA': '1',
        'CODUSUARIO': 'mestre',
        'CODCOLIGADA': '1',
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from('mestre:123456').toString('base64')
      };

      try {
        const response = await axios.post(url, req, { headers });
        return response.data ;
      } catch (error) {
        return(error);
      }
}