'use strict';

const { redis: redisConfig } = require(__dirname+'/../../configs/secrets.js')
	, { Boards } = require(__dirname+'/../../db/')
	, roomRegex = /^(?<roomBoard>[a-z0-9]+)-(?<roomName>[a-z0-9-]+)$/i
	, calcPerms = require(__dirname+'/../permission/calcperms.js')
	, { Permissions } = require(__dirname+'/../permission/permissions.js')
	, socketIO = require('socket.io')
	, { createAdapter } = require('@socket.io/redis-adapter')
	, Redis = require('ioredis');

// Single Redis client for publishing
let publishClient = null;

module.exports = {

	io: null,

	connect: (server, sessionMiddleware) => {
        //create redis adapter
		const io = socketIO(server);
		const pubClient = new Redis(redisConfig);
		const subClient = pubClient.duplicate();

        // Add error handlers for Redis clients
		pubClient.on('error', (err) => {
			console.error('Redis pub client error:', err);
		});
        
		subClient.on('error', (err) => {
			console.error('Redis sub client error:', err);
		});

        // Configure Redis adapter
		io.adapter(createAdapter(pubClient, subClient));

        // Setup session middleware
		const sessionRefresh = require(__dirname+'/../middleware/permission/sessionrefresh.js');
		io.use((socket, next) => {
			sessionMiddleware(socket.request, socket.request, next);
		});
		io.use((socket, next) => {
			sessionRefresh(socket.request, socket.request, next);
		});

		module.exports.io = io;

        // Subscribe to our custom channel for cross-process events
		const eventSub = new Redis(redisConfig);
		eventSub.subscribe('ptchan-events');
		eventSub.on('message', (channel, message) => {
			try {
				const data = JSON.parse(message);
				if (data && data.room && data.event && data.message) {
					io.to(data.room).emit(data.event, data.message);
				}
			} catch (err) {
				console.error('Error processing Redis message:', err);
			}
		});

        //start accepting connections
		io.on('connection', socket => {
			socket.on('ping', cb => {
				if (typeof cb === 'function') {
					cb();
				}
			});

			socket.on('room', async (room) => {
                //check if a valid formatted room name
				const roomMatch = room.match(roomRegex);
				if (roomMatch && roomMatch.groups) {
					const { roomBoard, roomName } = roomMatch.groups;
					let hasPermission = true;

                    //permission to manage/globalmanage based on MANAGE_GLOBAL/BOARD permissions
					if (room === 'globalmanage-recent-raw'
                        || room === 'globalmanage-recent-hashed') {
						socket.request.locals.board = null;
						socket.request.locals.permissions = calcPerms(socket.request, socket.request);
						hasPermission = socket.request.locals.permissions.get(Permissions.MANAGE_GLOBAL_GENERAL);
					} else {
						socket.request.locals.board = await Boards.findOne(roomBoard);
						socket.request.locals.permissions = calcPerms(socket.request, socket.request);
						if (roomName === 'manage-recent-hashed'
                            || roomName === 'manage-recent-raw') {
							hasPermission = socket.request.locals.permissions.get(Permissions.MANAGE_BOARD_GENERAL);
						}
					}

                    //if raw, must have room permission AND raw ip permission
					if (room.endsWith('-raw')) {
						hasPermission = hasPermission && socket.request.locals.permissions.get(Permissions.VIEW_RAW_IP);
					}

                    //user has perms to join
					if (hasPermission === true) {
						socket.join(room);
						return socket.send('joined');
					}
				}

                //invalid room or no perms
				socket.disconnect(true);
			});
		});
	},

	emitRoom: async (room, event, message) => {
		if (!module.exports.io) {
            // If Socket.IO isn't initialized, publish to Redis
			if (!publishClient) {
				publishClient = new Redis(redisConfig);
			}
			try {
				await publishClient.publish('ptchan-events', JSON.stringify({
					room,
					event,
					message
				}));
				console.log(`Published ${event} to Redis for room ${room}`);
			} catch (err) {
				console.error(`Error publishing to Redis for room ${room}:`, err);
			}
			return;
		}

		try {
			await module.exports.io.to(room).emit(event, message);
			console.log(`Emitted ${event} to room ${room}`);
		} catch (err) {
			console.error(`Error emitting to room ${room}:`, err);
		}
	},

	cleanup: () => {
		if (publishClient) {
			publishClient.quit();
			publishClient = null;
		}
	}
};