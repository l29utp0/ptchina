'use strict';

const { buildFaq } = require(__dirname+'/../../lib/build/tasks.js');

module.exports = async (req, res, next) => {

	let html;
	try {
		html = await buildFaq();
	} catch (err) {
		return next(err);
	}

	return res.set('Cache-Control', 'max-age=0').send(html);

};