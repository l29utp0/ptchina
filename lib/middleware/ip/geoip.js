'use strict';

const { getAnonymizerCode , isAnonymizer } = require(__dirname+'/../../misc/countries.js')
	, config = require(__dirname+'/../../misc/config.js');

module.exports = (req, res, next) => {
	const { countryCodeHeader } = config.get;
	let code = req.headers[countryCodeHeader] || 'XX';
	const anonymizerCode = getAnonymizerCode(req);
	if (anonymizerCode) {
		code = anonymizerCode;
	}
	res.locals.anonymizer = isAnonymizer(code);
	res.locals.country = {
		code,
	};
	return next();
};
