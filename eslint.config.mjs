import { defineConfig, globalIgnores } from 'eslint/config';
import jest from 'eslint-plugin-jest';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

export default defineConfig([globalIgnores([
	'**/docker/',
	'**/tmp/',
	'**/static/',
	'gulp/res/css/',
	'gulp/res/icons/',
	'gulp/res/img/',
	'**/views/',
	'**/node_modules/',
	'gulp/res/js/pugfilters.js',
	'gulp/res/js/locals.js',
	'gulp/res/js/post.js',
	'gulp/res/js/modal.js',
	'gulp/res/js/uploaditem.js',
	'gulp/res/js/pugfilter.js',
	'gulp/res/js/banmessage.js',
	'gulp/res/js/captchaformsection.js',
	'gulp/res/js/watchedthread.js',
	'gulp/res/js/threadwatcher.js',
	'gulp/res/js/socket.io.js',
	'gulp/res/js/web3.js',
	'gulp/res/js/tegaki.js',
]), {
	extends: compat.extends('eslint:recommended'),

	plugins: {
		jest,
	},

	languageOptions: {
		globals: {
			...globals.node,
			...globals.browser,
			...globals.commonjs,
			...jest.environments.globals.globals,
		},

		ecmaVersion: 'latest',
		sourceType: 'module',
	},

	rules: {
		'block-spacing': ['error', 'always'],

		'keyword-spacing': ['error', {
			before: true,
			after: true,
		}],

		'space-before-blocks': ['error', 'always'],

		'brace-style': ['error', '1tbs', {
			allowSingleLine: true,
		}],

		indent: ['error', 'tab', {
			SwitchCase: 1,
			ignoreComments: true,
			MemberExpression: 1,
		}],

		'linebreak-style': ['error', 'unix'],
		quotes: ['error', 'single'],
		semi: ['error', 'always'],
		curly: ['error'],

		'no-multiple-empty-lines': ['error', {
			max: 1,
		}],

		'no-template-curly-in-string': ['error'],

		'no-unused-vars': ['error', {
			'argsIgnorePattern': '^(e|err)$',
			'varsIgnorePattern': '^(e|err)$'
		}],
	},
}]);
