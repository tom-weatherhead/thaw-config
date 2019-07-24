// thaw-config/src/main.js

'use strict';

const babelTargetOptionsForClientProfile = require('../config/babel-targets-client-side');
const babelTargetOptionsForServerProfile = require('../config/babel-targets-server-side');

function ifDefinedElse (value, defaultValue) {
	return typeof value !== 'undefined' ? value : defaultValue;
}

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

function getBabelOptions (babelOptionsIn = {}) {
	// { targetName: foo (or targetOptions: fooOptions), transformClasses: [true | false | undefined] }

	const pluginsArray = [
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

module.exports = {
	babel: {
		client: babelTargetOptionsForClientProfile,
		server: babelTargetOptionsForServerProfile,
		getOptions: getBabelOptions
	},
	grunt: (options = {}) => grunt => {
		const dirname = options.dirname || '';
		const babelOptions = options.babelOptions || {};

		const eslint = ifDefinedElse(options.eslint, true);
		const mocha = ifDefinedElse(options.mocha, false);
		const webpack = ifDefinedElse(options.webpack, false);

		const forClient = webpack && options.forClient;
		const forServer = webpack && options.forServer;
		const concat = webpack && forClient && forServer;
		// const concat = webpack && sum([forClient, forServer].map(bool => bool ? 1 : 0)) > 1;

		const packageJsonFilename = 'package.json';
		const gruntfile = grunt.file.readJSON(packageJsonFilename);
		const initGruntConfigOptions = {
			pkg: gruntfile
		};

		if (concat) {
			initGruntConfigOptions.concat = {
				options: {
					banner: '/**\n' +
					' * <%= pkg.name %>\n' +
					' *\n' +
					' * @copyright <%= grunt.template.today(\'yyyy\') %> <%= pkg.author %>\n' +
					' * @license <%= pkg.license %>\n' +
					' * @version <%= pkg.version %>\n' +
					' */\n'
				},
				dist: {
					src: [
						'<banner>',
						'insertia/1.js',
						'dist/<%= pkg.shortName %>-commonjs2.js',
						'insertia/2.js',
						'dist/<%= pkg.shortName %>-global.js',
						'insertia/3.js'
					],
					dest: 'dist/<%= pkg.shortName %>.js'
				}
			};
		}

		if (eslint) {
			initGruntConfigOptions.eslint = {
				target: [
					'*.js',
					'src/*.js',
					'test/*.js'
				]
			};
		}

		if (mocha) {
			initGruntConfigOptions.mochaTest = {
				options: {
					reporter: 'spec'
				},
				test: {
					src: ['test/*_spec.js']
				}
			};
		}

		if (webpack) {
			const getWebpackConfig = (mode, targetProfileName) => {
				const path = require('path');
				const libraryTarget = targetProfileName === 'client' ? 'global' : targetProfileName === 'server' ? 'commonjs2' : '';
				const filename = `${ gruntfile.shortName }-${libraryTarget}.js`;

				babelOptions.targetProfileName = targetProfileName;

				return {
					mode: mode,
					entry: './src/main.js',
					target: targetProfileName === 'server' ? 'node' : undefined, // See https://stackoverflow.com/questions/43915463/webpack-node-js-http-module-http-createserver-is-not-a-function
					output: {
						path: path.join(dirname, 'dist'),
						filename: filename,
						library: gruntfile.shortName,
						// See https://webpack.js.org/configuration/output/#output-librarytarget
						libraryTarget: libraryTarget
					},
					module: {
						rules: [
							{
								test: /\.js[x]?$/,
								exclude: /node_modules/,
								use: [
									{
										loader: 'babel-loader',
										options: getBabelOptions(babelOptions)
									}
								]
							}
						]
					} //,
					// devtool: 'source-map'
				};
			};

			initGruntConfigOptions.webpack = {
				// Possible values for libraryTarget: See https://webpack.js.org/configuration/output/#output-librarytarget :
				// amd, amd-require, assign, commonjs, commonjs2, global, jsonp, this, umd, var, window.
				prodserver: getWebpackConfig('production', 'server'),
				prodclient: getWebpackConfig('production', 'client')
			};
		}

		// Initialize Grunt.
		grunt.initConfig(initGruntConfigOptions);

		// Load Grunt Tasks.

		if (concat) {
			grunt.loadNpmTasks('grunt-contrib-concat');
		}

		if (eslint) {
			grunt.loadNpmTasks('grunt-eslint');
		}

		if (mocha) {
			grunt.loadNpmTasks('grunt-mocha-test');
		}

		if (webpack) {
			grunt.loadNpmTasks('grunt-webpack');
		}

		// Create the list of build tasks.
		const buildTasks = [];

		if (forClient) {
			buildTasks.push('webpack:prodclient');
		}

		if (forServer) {
			buildTasks.push('webpack:prodserver');
		}

		if (buildTasks.length >= 2) {
			buildTasks.push('concat');
		}

		// Aliases : Register Grunt Tasks.
		grunt.registerTask('build', buildTasks);

		const preBuildTestTasks = [];
		const postBuildTestTasks = [];

		if (eslint) {
			preBuildTestTasks.push('eslint');
		}

		if (mocha) {
			postBuildTestTasks.push('mochaTest');
		}

		grunt.registerTask('preBuildTest', preBuildTestTasks);
		grunt.registerTask('postBuildTest', postBuildTestTasks);
		grunt.registerTask('test', ['preBuildTest', 'postBuildTest']);
		grunt.registerTask('default', ['preBuildTest', 'build', 'postBuildTest']);
	},
	version: require('../package.json').version
};
