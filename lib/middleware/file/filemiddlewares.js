'use strict';

const { debugLogs } = require(__dirname+'/../../../configs/secrets.js')
	, dynamicResponse = require(__dirname+'/../../misc/dynamic.js')
	, { addCallback } = require(__dirname+'/../../redis/redis.js')
	, upload = require('@fatchan/express-fileupload')
	, { Permissions } = require(__dirname+'/../../permission/permissions.js')
	, formatSize = require(__dirname+'/../../converter/formatsize.js')
	, fileHandlers = {};

// Pre-check middleware to enforce size limits before processing
const checkFileSize = (req, res, next) => {
	const { __ } = res.locals;
	if (!req.headers['content-length']) {
		return next();
	}

	const hasDonorPerms = res.locals.permissions && res.locals.permissions.get(Permissions.DONOR);
	const maxSize = hasDonorPerms ? Infinity : 25 * 1024 * 1024; // 25MB for non-donors
	const contentLength = parseInt(req.headers['content-length']);

	if (!hasDonorPerms && contentLength > maxSize) {
		return dynamicResponse(req, res, 413, 'message', {
			'title': __('Payload Too Large'),
			'message': __('Your upload of %s exceeds the maximum of %s. Donate to increase this limit.',
				formatSize(contentLength),
				formatSize(maxSize)),
			'redirect': req.headers.referer
		});
	}
	next();
};

const fileSizeLimitFunction = (req, res) => {
	const { __ } = res.locals;
	const hasDonorPerms = res.locals.permissions && res.locals.permissions.get(Permissions.DONOR);
	const maxSize = hasDonorPerms ? Infinity : 25 * 1024 * 1024;
	const size = Array.isArray(req.files.file)
		? req.files.file.reduce((acc, f) => acc + f.size, 0)
		: req.files.file.size;

	return dynamicResponse(req, res, 413, 'message', {
		'title': __('Payload Too Large'),
		'message': __('Your upload of %s exceeds the maximum of %s. Donate to increase this limit.',
			formatSize(size),
			formatSize(maxSize)),
		'redirect': req.headers.referer
	});
};

const missingExtensionLimitFunction = (req, res) => {
	const { __ } = res.locals;
	return dynamicResponse(req, res, 400, 'message', {
		'title': __('Bad Request'),
		'message': __('Missing file extensions'),
		'redirect': req.headers.referer
	});
};

const updateHandlers = () => {
	const { globalLimits, filterFileNames, spaceFileNameReplacement, uriDecodeFileNames } = require(__dirname+'/../../misc/config.js').get;

	['flag', 'banner', 'asset', 'post'].forEach(fileType => {
		const fileSizeLimit = globalLimits[`${fileType}FilesSize`];
		const fileNumLimit = globalLimits[`${fileType}Files`];

		const fileNumLimitFunction = (req, res) => {
			const { __ } = res.locals;
			const isPostform = req.path.endsWith('/post') || req.path.endsWith('/modpost');
			const message = (isPostform && res.locals.board)
				? __(`Max files per post ${res.locals.board.settings.maxFiles < globalLimits.postFiles.max ? 'on this board ' : ''}is %s`, res.locals.board.settings.maxFiles)
				: __('Max files per request is %s', fileNumLimit.max);
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Too many files'),
				'message': message,
				'redirect': req.headers.referer
			});
		};

		const uploadMiddleware = upload({
			defParamCharset: 'utf8',
			debug: debugLogs,
			createParentPath: true,
			safeFileNames: filterFileNames,
			spaceFileNameReplacement,
			preserveExtension: 4,
			uriDecodeFileNames,
			limits: (req, res) => {
				const hasDonorPerms = res.locals.permissions && res.locals.permissions.get(Permissions.DONOR);
				const maxSize = hasDonorPerms ? fileSizeLimit.max : Math.min(25 * 1024 * 1024, fileSizeLimit.max);
				return {
					totalSize: maxSize,
					fileSize: maxSize,
					files: fileNumLimit.max,
				};
			},
			abortOnLimit: true,
			responseOnLimit: true,
			parseNested: false,
			limitHandler: fileSizeLimitFunction,
			numFilesLimitHandler: fileNumLimitFunction,
			extensionLimitHandler: missingExtensionLimitFunction,
			useTempFiles: true,
			tempFileDir: __dirname+'/../../../tmp/'
		});

		fileHandlers[fileType] = (req, res, next) => {
			checkFileSize(req, res, () => {
				uploadMiddleware(req, res, next);
			});
		};
	});
};

updateHandlers();
addCallback('config', updateHandlers);

module.exports = {
	asset: (req, res, next) => {
		return fileHandlers.asset(req, res, next);
	},
	banner: (req, res, next) => {
		return fileHandlers.banner(req, res, next);
	},
	flag: (req, res, next) => {
		return fileHandlers.flag(req, res, next);
	},
	posts: (req, res, next) => {
		return fileHandlers.post(req, res, next);
	},
};
