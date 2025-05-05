'use strict';

module.exports = async(db) => {
	console.log('fixing index for custompages');
	try {
		await db.collection('custompages').dropIndex('board_1_url_1');
	// eslint-disable-next-line no-unused-vars
	} catch (e) {
		// didnt have the bad index
	}
	await db.collection('custompages').createIndex({ 'board': 1, 'page': 1 }, { unique: true });
};
