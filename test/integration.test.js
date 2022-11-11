describe('run integration tests', () => {
	require('./setup.js')();
	require('./twofactor.js')();
	require('./posting.js')();
	require('./global.js')();
	require('./actions.js')();
	require('./board.js')();
	require('./pages.js')();
	require('./cleanup.js')();
});
