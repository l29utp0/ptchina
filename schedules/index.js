'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const Mongo = require(__dirname+'/../db/db.js')
	, config = require(__dirname+'/../config.js');

(async () => {

	await Mongo.connect();
	await Mongo.checkVersion();
	await config.load();

	//start all the scheduled tasks
	require(__dirname+'/tasks/index.js');

	//update board stats and homepage task, use cron and bull for proper timing
	require(__dirname+'/../queue.js').push({
		'task': 'updateStats',
		'options': {}
	}, {
		'repeat': {
			'cron': '0 * * * *'
		}
	});

})();
