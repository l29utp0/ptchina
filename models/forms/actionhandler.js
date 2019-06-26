'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, Boards = require(__dirname+'/../../db/boards.js')
	, Mongo = require(__dirname+'/../../db/db.js')
	, banPoster = require(__dirname+'/banposter.js')
	, deletePosts = require(__dirname+'/deletepost.js')
	, spoilerPosts = require(__dirname+'/spoilerpost.js')
	, stickyPosts = require(__dirname+'/stickyposts.js')
	, sagePosts = require(__dirname+'/sageposts.js')
	, lockPosts = require(__dirname+'/lockposts.js')
	, deletePostsFiles = require(__dirname+'/deletepostsfiles.js')
	, reportPosts = require(__dirname+'/reportpost.js')
	, globalReportPosts = require(__dirname+'/globalreportpost.js')
	, dismissReports = require(__dirname+'/dismissreport.js')
	, dismissGlobalReports = require(__dirname+'/dismissglobalreport.js')
	, { buildCatalog, buildThread, buildBoardMultiple } = require(__dirname+'/../../build.js');

module.exports = async (req, res, next) => {

	//get the ids
	const postMongoIds = res.locals.posts.map(post => Mongo.ObjectId(post._id));
	let passwordPostMongoIds = [];
	let passwordPosts = [];
	if (!res.locals.hasPerms && res.locals.actions.anyPasswords) {
		//just to avoid multiple filters and mapping, do it all here
		passwordPosts = res.locals.posts.filter(post => {
			if (post.password != null
				&& post.password.length > 0
				&& post.password == req.body.password) {
				passwordPostMongoIds.push(Mongo.ObjectId(post._id))
				return true;
			}
		});
		if (passwordPosts.length === 0) {
			return res.status(403).render('message', {
				'title': 'Forbidden',
				'error': 'Password did not match any selected posts',
				'redirect': `/${req.params.board ? req.params.board+'/' : 'globalmanage.html'}`
			});
		}
	} else {
		passwordPosts = res.locals.posts;
		passwordPostMongoIds = postMongoIds;
	}
	const messages = [];
	const combinedQuery = {};
	const passwordCombinedQuery = {};
	let aggregateNeeded = false;
	try {
		// if getting global banned, board ban doesnt matter
		if (req.body.global_ban) {
			const { message, action, query } = await banPoster(req, res, next, null, res.locals.posts);
			if (action) {
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		} else if (req.body.ban) {
			const { message, action, query } = await banPoster(req, res, next, req.params.board, res.locals.posts);
			if (action) {
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		}
		if (req.body.delete_ip_board || req.body.delete_ip_global) {
			const deletePostIps = res.locals.posts.map(x => x.ip);
			let query = {
				'ip': {
					'$in': deletePostIps
				}
			};
			if (req.body.delete_ip_board) {
				query['board'] = req.params.board;
			}
			const deleteIpPosts = await Posts.db.find(query).toArray();
			res.locals.posts = res.locals.posts.concat(deleteIpPosts);
			if (deleteIpPosts && deleteIpPosts.length > 0) {
				const { action, message } = await deletePosts(req, res, next, deleteIpPosts, req.params.board);
				messages.push(message);
				if (action) {
					aggregateNeeded = true;
				} else {
					req.body.delete_uiip_board = false;
					req.body.delete_ip_global = false;
					res.locals.actions.anyValid--;
				}
			}
		} else if (req.body.delete) {
			const { action, message } = await deletePosts(req, res, next, passwordPosts, req.params.board);
			messages.push(message);
			if (action) {
				aggregateNeeded = true;
			} else {
				req.body.delete = false;
				res.locals.actions.anyValid--;
			}
		} else {
			// if it was getting deleted, we cant do any of these
			if (req.body.delete_file || req.body.unlink_file) {
				const { message, action, query } = await deletePostsFiles(passwordPosts, req.body.unlink_file);
				if (action) {
					aggregateNeeded = true;
					passwordCombinedQuery[action] = { ...passwordCombinedQuery[action], ...query}
				} else {
					req.body.delete_file = false;
					req.body.unlink_file = false;
					res.locals.actions.anyValid--;
				}
				messages.push(message);
			} else if (req.body.spoiler) {
				const { message, action, query } = spoilerPosts(passwordPosts);
				if (action) {
					passwordCombinedQuery[action] = { ...passwordCombinedQuery[action], ...query}
				} else {
					req.body.spoiler = false;
					res.locals.actions.anyValid--;
				}
				messages.push(message);
			}
			//lock, sticky, sage
			if (req.body.sage) {
				const { message, action, query } = sagePosts(res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				} else {
					req.body.sage = false;
					res.locals.actions.anyValid--;
				}
				messages.push(message);
			}
			if (req.body.lock) {
				const { message, action, query } = lockPosts(res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				} else {
                    req.body.lock = false;
					res.locals.actions.anyValid--;
                }
				messages.push(message);
			}
			if (req.body.sticky) {
				const { message, action, query } = stickyPosts(res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				} else {
                    req.body.sticky = false;
					res.locals.actions.anyValid--;
                }
				messages.push(message);
			}
			// cannot report and dismiss at same time
			if (req.body.report) {
				const { message, action, query } = reportPosts(req, res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
                }
				messages.push(message);
			} else if (req.body.dismiss) {
				const { message, action, query } = dismissReports(res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				} else {
                    req.body.dismiss = false;
					res.locals.actions.anyValid--;
                }
				messages.push(message);
			}
			// cannot report and dismiss at same time
			if (req.body.global_report) {
				const { message, action, query } = globalReportPosts(req, res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			} else if (req.body.global_dismiss) {
				const { message, action, query } = dismissGlobalReports(res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				} else {
                    req.body.global_dismiss = false;
					res.locals.actions.anyValid--;
                }
				messages.push(message);
			}
		}
		if (res.locals.actions.anyValid > 0) {
			const bulkWrites = [];
			if (Object.keys(combinedQuery).length > 0) {
				bulkWrites.push({
					'updateMany': {
						'filter': {
							'_id': {
								'$in': postMongoIds
							}
						},
						'update': combinedQuery
					}
				});
			}
			if (Object.keys(passwordCombinedQuery).length > 0) {
				bulkWrites.push({
					'updateMany': {
						'filter': {
							'_id': {
								'$in': passwordPostMongoIds
							}
						},
						'update': passwordCombinedQuery
					}
				});
			}

			//get a map of boards to threads affected
			const boardThreadMap = {};
			const queryOrs = [];
			for (let i = 0; i < res.locals.posts.length; i++) {
				const post = res.locals.posts[i];
				if (!boardThreadMap[post.board]) {
					boardThreadMap[post.board] = [];
				}
				if (!post.thread) {
					//a thread was directly selected on this board, not just posts. so we handle deletes differently
					boardThreadMap[post.board]['selectedThreads'] = true;
				}
				boardThreadMap[post.board].push(post.thread || post.postId);
			}

			const beforePages = {};
			const threadBoards = Object.keys(boardThreadMap);
			//get how many pages each board is to know whether we should rebuild all pages (because of page nav changes)
			//only if deletes actions selected because this could result in number of pages to change
			if (req.body.delete || req.body.delete_ip_board || req.body.delete_ip_global) {
				await Promise.all(threadBoards.map(async board => {
					beforePages[board] = Math.ceil((await Posts.getPages(board)) / 10);
				}));
			}

			//execute actions now
			if (bulkWrites.length > 0) {
				await Posts.db.bulkWrite(bulkWrites);
			}

			//get only posts (so we can use them for thread ids
			if (aggregateNeeded) {
				const selectedPosts = res.locals.posts.filter(post => post.thread !== null);
				//recalculate replies and image counts
				await Promise.all(selectedPosts.map(async (post) => {
					const replyCounts = await Posts.getReplyCounts(post.board, post.thread);
					let replyposts = 0;
					let replyfiles = 0;
					if (replyCounts[0]) {
						replyposts = replyCounts[0].replyposts;
						replyfiles = replyCounts[0].replyfiles;
					}
					Posts.setReplyCounts(post.board, post.thread, replyposts, replyfiles);
				}));
			}

			//make it into an OR query for the db
			for (let i = 0; i < threadBoards.length; i++) {
				const threadBoard = threadBoards[i];
				boardThreadMap[threadBoard] = [...new Set(boardThreadMap[threadBoard])]
				queryOrs.push({
					'board': threadBoard,
					'postId': {
						'$in': boardThreadMap[threadBoard]
					}
				})
			}

			//fetch threads per board that we only checked posts for
			let threadsEachBoard = await Posts.db.find({
				'thread': null,
				'$or': queryOrs
			}).toArray();
			//combine it with what we already had
			const selectedThreads = res.locals.posts.filter(post => post.thread === null)
			threadsEachBoard = threadsEachBoard.concat(selectedThreads)

			//get the oldest and newest thread for each board to determine how to delete
			const threadBounds = threadsEachBoard.reduce((acc, curr) => {
				if (!acc[curr.board] || curr.bumped < acc[curr.board].bumped) {
					acc[curr.board] = { oldest: null, newest: null};
				}
				if (!acc[curr.board].oldest || curr.bumped < acc[curr.board].oldest.bumped) {
					acc[curr.board].oldest = curr;
				}
				if (!acc[curr.board].newest || curr.bumped > acc[curr.board].newest.bumped) {
					acc[curr.board].newest = curr;
				}
				return acc;
			}, {});

			//if there are actions that can cause some rebuilding
			//TODO: move this check earlier and move the db builkwrite earlier if possible
			if (res.locals.actions.anyBuild > 0) {

				const parallelPromises = []
				const boardNames = Object.keys(threadBounds);
				const buildBoards = {};
				const multiBoards = await Boards.db.find({
					'_id': {
						'$in': boardNames
					}
				}).toArray();
				multiBoards.forEach(board => {
					buildBoards[board._id] = board;
				});

				for (let i = 0; i < boardNames.length; i++) {
					const boardName = boardNames[i];
					const bounds = threadBounds[boardName];
					//always need to refresh catalog
					/*
						TODO: not rebuild catalog when a building action occurs that only affects thread posts
						e.g. spoiler a post images that isnt an OP. This wont affect the catalog at all since
						reply and image counts dont change, and the OP isnt changed in the catalog tile.
					*/
					//rebuild impacted threads
					for (let j = 0; j < boardThreadMap[boardName].length; j++) {
						parallelPromises.push(buildThread(boardThreadMap[boardName][j], buildBoards[boardName]));
					}
					//refersh any pages affected
					const afterPages = Math.ceil((await Posts.getPages(boardName)) / 10);
					let catalogRebuild = true;
					if (beforePages[boardName] && beforePages[boardName] !== afterPages) {
						//amount of pages changed, rebuild all pages
						parallelPromises.push(buildBoardMultiple(buildBoards[boardName], 1, afterPages));
					} else {
						const threadPageOldest = await Posts.getThreadPage(boardName, bounds.oldest);
						const threadPageNewest = bounds.oldest.postId === bounds.newest.postId ? threadPageOldest : await Posts.getThreadPage(boardName, bounds.newest);
						if (req.body.delete || req.body.delete_ip_board || req.body.delete_ip_global) {
							if (!boardThreadMap[boardName].selectedThreads) {
								//onyl deleting posts from threads, so thread order wont change, thus we dont delete all pages after
								parallelPromises.push(buildBoardMultiple(buildBoards[boardName], threadPageNewest, threadPageOldest));
							} else {
								//deleting threads, so we delete all pages after
								parallelPromises.push(buildBoardMultiple(buildBoards[boardName], threadPageNewest, afterPages));
							}
						} else if (req.body.sticky) { //else if -- if deleting, other actions are not executed/irrelevant
							//rebuild current and newer pages
							parallelPromises.push(buildBoardMultiple(buildBoards[boardName], 1, threadPageOldest));
						} else if (req.body.lock || req.body.sage || req.body.unlink_file) {
							parallelPromises.push(buildBoardMultiple(buildBoards[boardName], threadPageNewest, threadPageOldest));
						} else if (req.body.spoiler || req.body.ban || req.body.global_ban) {
							parallelPromises.push(buildBoardMultiple(buildBoards[boardName], threadPageNewest, threadPageOldest));
							if (!boardThreadMap[boardName].selectedThreads) {
								catalogRebuild = false;
								//these actions dont affect the catalog tile since not on an OP and dont change reply/image counts
							}
						}
					}
					if (catalogRebuild) {
						//the actions will affect the catalog, so we better rebuild it
						parallelPromises.push(buildCatalog(buildBoards[boardName]));
					}
				}
				await Promise.all(parallelPromises);
			}
		}

	} catch (err) {
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': `/${req.params.board ? req.params.board+'/' : 'globalmanage.html'}`
	});

}