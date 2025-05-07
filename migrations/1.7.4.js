'use strict';

module.exports = async(db, redis) => {
	console.log('Adding infiniteScroll and sound notifications to frontendScriptDefault in globalsettings');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'frontendScriptDefault.infiniteScroll': true,
			'frontendScriptDefault.notificationsSound': true
		},
	});

	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
};
