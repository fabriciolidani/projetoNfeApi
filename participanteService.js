const request = require('request');

const ParticipanteService = {

    async getNamePorId(plano, idParticipante, tokenStockDados, middleware) {
		return new Promise((resolve, reject) => {
			let url_stockdados = util.getConfig().url_stockdados;
			let url = util.getConfig().url_stockdados + plano + '/middleware/participante/id?idParticipante=' + idParticipante;
			let options = util.formatOptions('GET', url, middleware, tokenStockDados);
			request(options, (error, response) => {
				if (error) {
					reject(error);
				} else if (response.body.error) {
					console.log( "ERROR stockdados: " + JSON.stringify(response.body))
					reject(response.body.error);
				} else{
					resolve(response.body);
				}
			});
		})
	},


};

module.exports = ParticipanteService;
