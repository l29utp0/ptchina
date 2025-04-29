'use strict';

module.exports = async(db, redis) => {
    console.log('Adding autoDeleteReports threshold to globalsettings');
    await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
        '$set': {
            'autoDeleteReports': 5, // Default to 5 unique IP reports
        },
    });

    console.log('Clearing globalsettings cache');
    await redis.deletePattern('globalsettings');
};