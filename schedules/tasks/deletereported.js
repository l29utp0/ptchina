'use strict';

const { Posts, Boards, Files } = require(__dirname+'/../../db/')
	, { debugLogs } = require(__dirname+'/../../configs/secrets.js')
	, timeUtils = require(__dirname+'/../../lib/converter/timeutils.js')
	, buildQueue = require(__dirname+'/../../lib/build/queue.js')
	, { remove } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
	, Socketio = require(__dirname+'/../../lib/misc/socketio.js')
	, { func: pruneFiles } = require(__dirname+'/../../schedules/tasks/prune.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, deletePostFiles = require(__dirname+'/../../lib/file/deletepostfiles.js');

// Define the emitPostDeletion function within the module scope
const emitPostDeletion = async (post) => {
	try {
		const threadId = post.thread || post.postId;
		const roomName = `${post.board}-${threadId}`;
		debugLogs && console.log(`[${new Date().toISOString()}] Emitting delete event for post ${post.postId} in room ${roomName}`);
		await Socketio.emitRoom(roomName, 'markPost', {
			postId: post.postId,
			type: 'delete'
		});
	} catch (err) {
		console.error(`[${new Date().toISOString()}] Failed to emit deletion for post ${post.postId}:`, err);
	}
};

module.exports = {
	func: async () => {
		try {
            // Get the threshold from config
			const reportThreshold = config.get.autoDeleteReports;

            // If threshold is 0, auto-deletion is disabled
			if (reportThreshold === 0) {
				debugLogs && console.log(`[${new Date().toISOString()}] Auto-delete reports disabled (threshold = 0)`);
				return;
			}

            // First get all posts that have any reports
			const reportedPosts = await Posts.db.find({
				'$or': [
					{ 'reports.0': { '$exists': true } },
					{ 'globalreports.0': { '$exists': true } }
				]
			}).toArray();

            // Then filter for posts with enough unique IP reports
			const postsToDelete = [];
			for (const post of reportedPosts) {
				const uniqueReportCount = await Posts.getUniqueIPReportCount(post.board, post.postId);
				if (uniqueReportCount >= reportThreshold) {
					postsToDelete.push(post);
				}
			}

			if (postsToDelete.length > 0) {
				debugLogs && console.log(`[${new Date().toISOString()}] Auto-deleting ${postsToDelete.length} posts with ${reportThreshold} or more unique IP global reports`);

                // Get thread OPs
				const threads = postsToDelete.filter(x => x.thread == null);

                // Handle file deletion first
				const { pruneImmediately } = config.get;
				const postFiles = postsToDelete.reduce((acc, post) => {
					if (post.files && post.files.length > 0) {
						acc = acc.concat(post.files);
					}
					return acc;
				}, []);

				if (postFiles.length > 0) {
					debugLogs && console.log(`[${new Date().toISOString()}] Found ${postFiles.length} files to process`);
                    // Decrement file references
					const fileNames = postFiles.map(x => x.filename);
					await Files.decrement(fileNames);

                    // Delete the files if configured to do so
					if (pruneImmediately) {
						await pruneFiles(fileNames);
					}

                    // Delete the actual files
					await deletePostFiles(postFiles);
				}

                // Delete posts from database
				await Posts.deleteMany(postsToDelete.map(post => post._id));

                // Handle thread posts
				let threadPosts = [];
				if (threads.length > 0) {
					for (const thread of threads) {
						const posts = await Posts.getThreadPosts(thread.board, thread.postId);
						threadPosts = threadPosts.concat(posts);
					}

                    // Handle files in thread posts
					const threadPostFiles = threadPosts.reduce((acc, post) => {
						if (post.files && post.files.length > 0) {
							acc = acc.concat(post.files);
						}
						return acc;
					}, []);

					if (threadPostFiles.length > 0) {
						debugLogs && console.log(`[${new Date().toISOString()}] Found ${threadPostFiles.length} files in thread posts to process`);
                        // Decrement file references
						const threadFileNames = threadPostFiles.map(x => x.filename);
						await Files.decrement(threadFileNames);

                        // Delete the files if configured to do so
						if (pruneImmediately) {
							await pruneFiles(threadFileNames);
						}

                        // Delete the actual files
						await deletePostFiles(threadPostFiles);
					}

					if (threadPosts.length > 0) {
						await Posts.deleteMany(threadPosts.map(p => p._id));
					}
				}

                // Delete thread HTML/JSON files and emit socket events
				for (const thread of threads) {
					await Promise.all([
						remove(`${uploadDirectory}/html/${thread.board}/thread/${thread.postId}.html`),
						remove(`${uploadDirectory}/json/${thread.board}/thread/${thread.postId}.json`)
					]);
					await emitPostDeletion(thread);
				}

                // Emit socket events for other posts
				for (const post of postsToDelete.concat(threadPosts)) {
					if (!threads.some(t => t.postId === post.postId)) {
						await emitPostDeletion(post);
					}
				}

                // Queue rebuilds
				const boardThreads = new Map();
				for (const post of postsToDelete.concat(threadPosts)) {
					const board = post.board;
					const thread = post.thread || post.postId;

					if (!boardThreads.has(board)) {
						boardThreads.set(board, {
							threads: new Set(),
							boardData: null
						});
					}
					boardThreads.get(board).threads.add(thread);
				}

                // Rebuild each affected board
				for (const [boardId, data] of boardThreads) {
					const board = await Boards.findOne(boardId);
					if (!board) { continue; }

					for (const threadId of data.threads) {
						buildQueue.push({
							'task': 'buildThread',
							'options': {
								'threadId': threadId,
								'board': board
							}
						});
					}

					const maxPage = Math.min(
						Math.ceil((await Posts.getPages(boardId)) / 10),
						Math.ceil(board.settings.threadLimit/10)
					) || 1;

					buildQueue.push({
						'task': 'buildBoardMultiple',
						'options': {
							'board': board,
							'startpage': 1,
							'endpage': maxPage
						}
					});

					buildQueue.push({
						'task': 'buildCatalog',
						'options': {
							'board': board
						}
					});
				}
			}
		} catch (err) {
			console.error(`[${new Date().toISOString()}] Error in deletereported task:`, err);
		}
	},

	interval: timeUtils.MINUTE * 10,
	immediate: true,
	condition: null
};
