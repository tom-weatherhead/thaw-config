// thaw-config/src/main.js

'use strict';

const babelTargetOptionsForClientProfile = require('../config/babel-targets-client-side');
const babelTargetOptionsForServerProfile = require('../config/babel-targets-server-side');

function getBabelTargetOptionsFromProfileName (profileName) {

	switch (profileName) {
		case 'client':
			return babelTargetOptionsForClientProfile;

		case 'server':
			return babelTargetOptionsForServerProfile;

		default:
			return null;
	}
}

// module.exports = (options = {}) => {
module.exports = {
	babel: {
		client: babelTargetOptionsForClientProfile,
		server: babelTargetOptionsForServerProfile,
		getOptions: (babelOptionsIn = {}) => {
			// { targetName: foo (or targetOptions: fooOptions), transformClasses: [true | false | undefined] }
			let pluginsArray = [
				// ['@babel/plugin-transform-runtime'],
				// ['@babel/plugin-syntax-dynamic-import']
			];

			if (babelOptionsIn.transformClasses === true || babelOptionsIn.transformClasses === false) {
				pluginsArray.push(
					// From https://babeljs.io/docs/en/babel-plugin-transform-classes :
					[
						'@babel/plugin-transform-classes',
						{
							loose: babelOptionsIn.transformClasses
						}
					]
				);
			}

			// "@babel/core": "^7.4.3",
			// "@babel/plugin-syntax-dynamic-import": "^7.2.0",
			// "@babel/plugin-transform-classes": "^7.4.3",
			// "@babel/plugin-transform-runtime": "^7.4.4",
			// "@babel/preset-env": "^7.4.3",
			// "@babel/runtime": "^7.4.4",
			// "babel-loader": "^8.0.5",

			return {
				presets: [
					[
						'@babel/preset-env',
						{
							targets: babelOptionsIn.targetOptions || getBabelTargetOptionsFromProfileName(babelOptionsIn.targetProfileName) || {}
						}
					]
				],
				plugins: pluginsArray //,
				// comments: false,
				// sourceType: 'unambiguous'
			};
		}
	},
	version: require('../package.json').version
};
