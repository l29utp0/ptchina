'use strict';

module.exports = (req, res) => {
	// Check if user already has donor permission
	if (res.locals.permissions && res.locals.permissions.get(req.app.locals.Permissions.DONOR)) {
		return res.status(403).render('message', {
			'title': 'Obrigado pela doação',
			'message': 'Já fizeste uma doação, obrigado pelo teu apoio!',
			'redirect': '/account.html'
		});
	}
	res.render('donate', {
		csrf: req.csrfToken(),
		user: res.locals.user,
		permissions: res.locals.permissions
	});
};
