// thaw-config/src/main.js

'use strict';

const clientTargets = require('../config/babel-targets-client-side');
const serverTargets = require('../config/babel-targets-server-side');

// module.exports = (options = {}) => {
module.exports = {
	babel: {
		client: clientTargets,
		server: serverTargets,
		getOptions: (options = {}) => {
			// { targetName: foo (or targetOptions: fooOptions), transformClasses: [true | false | undefined] }
			let targetOptions;
			let pluginsArray = [];

			switch (options.targetName) {
				case 'client':
					targetOptions = clientTargets;
					break;

				case 'server':
					targetOptions = serverTargets;
					break;

				default:
					break;
			}

			if (options.transformClasses === true || options.transformClasses === false) {
				pluginsArray.push(
					[
						'@babel/plugin-transform-classes',
						{
							loose: options.transformClasses
						}
					]
				);
			}

			return {
				presets: [
					[
						'@babel/preset-env',
						{
							targets: targetOptions
						}
					]
				],
				// "@babel/core": "^7.4.3",
				// "@babel/plugin-syntax-dynamic-import": "^7.2.0",
				// "@babel/plugin-transform-classes": "^7.4.3",
				// "@babel/plugin-transform-runtime": "^7.4.4",
				// "@babel/preset-env": "^7.4.3",
				// "@babel/runtime": "^7.4.4",
				// "babel-loader": "^8.0.5",

				/*
				// plugins: [
				// 	'transform-class-properties'
				// ]
				// From https://babeljs.io/docs/en/babel-plugin-transform-classes :
				plugins: [
					['@babel/plugin-transform-classes', {
						'loose': true
						// 'loose': false
					}] //,
				// 	['@babel/plugin-transform-runtime'],
				// 	['@babel/plugin-syntax-dynamic-import']
				 */
				plugins: pluginsArray,
				comments: false,
				sourceType: 'unambiguous'
			};
		}
	},
	version: require('../package.json').version
};
