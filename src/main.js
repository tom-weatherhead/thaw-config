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

function getBabelOptions (babelOptionsIn = {}) {
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

// module.exports = (options = {}) => {
module.exports = {
	babel: {
		client: babelTargetOptionsForClientProfile,
		server: babelTargetOptionsForServerProfile,
		getOptions: getBabelOptions
	},
	grunt: {
		eslint: grunt => {
			const packageJsonFilename = 'package.json';
			const gruntfile = grunt.file.readJSON(packageJsonFilename);

			grunt.initConfig({
				pkg: gruntfile,
				eslint: {
					target: [
						'*.js',
						'src/*.js',
						'test/*.js'
					]
				}
			});

			// Tasks
			grunt.loadNpmTasks('grunt-eslint');

			// Aliases
			grunt.registerTask('test', ['eslint']);

			grunt.registerTask('default', ['test']);
		},
		eslint_nodeunit: grunt => {
			const packageJsonFilename = 'package.json';
			const gruntfile = grunt.file.readJSON(packageJsonFilename);

			grunt.initConfig({
				pkg: gruntfile,
				eslint: {
					target: [
						'*.js',
						'src/*.js',
						'test/*.js'
					]
				},
				nodeunit: {
					all: ['test/*_test.js']
				}
			});

			// Tasks
			grunt.loadNpmTasks('grunt-contrib-nodeunit');
			grunt.loadNpmTasks('grunt-eslint');

			grunt.registerTask('test', ['eslint', 'nodeunit']);
			grunt.registerTask('default', ['test']);
		},
		// eslint_webpack_concat_nodeunit: dirname => grunt => {
		eslint_webpack_concat_nodeunit: (options = {}) => grunt => {
		// eslint_webpack_concat_nodeunit: grunt => {
			// let options = {};
			const path = require('path');

			const dirname = options.dirname || '';
			const forClient = options.forClient;
			const forServer = options.forServer;
			const babelOptions = options.babelOptions || {};
			const nodeunit = typeof options.nodeunit !== 'undefined' ? options.nodeunit : true;

			// const forClient = true;
			// const forServer = true;
			const isConcatNeeded = forClient && forServer;
			// const isConcatNeeded = true;

			// console.log('eslint_webpack_concat_nodeunit: options are', options);
			// console.log('eslint_webpack_concat_nodeunit: dirname is', dirname);
			// console.log('eslint_webpack_concat_nodeunit: nodeunit is', nodeunit);

			const packageJsonFilename = 'package.json';
			const gruntfile = grunt.file.readJSON(packageJsonFilename);
			// const getWebpackConfig = (mode, libraryTarget) => {
			const getWebpackConfig = (mode, targetProfileName) => {
				// console.log(`eslint_webpack_concat_nodeunit: getWebpackConfig(${mode}, ${targetProfileName})`);

				const libraryTarget = targetProfileName === 'client' ? 'global' : targetProfileName === 'server' ? 'commonjs2' : '';
				// const babelTargets = libraryTarget === 'commonjs2' ? babelTargetOptionsForServerProfile : babelTargetOptionsForClientProfile;

				// const filename = `${ gruntfile.shortName }-webpack-${mode}-${libraryTarget}${filenameSuffix}.js`;
				const filename = `${ gruntfile.shortName }-${libraryTarget}.js`;

				// console.log('eslint_webpack_concat_nodeunit: filename is', filename);

				babelOptions.targetProfileName = targetProfileName;

				return {
					mode: mode,
					entry: './src/main.js',
					// target: libraryTarget === 'commonjs2' ? 'node' : undefined, // See https://stackoverflow.com/questions/43915463/webpack-node-js-http-module-http-createserver-is-not-a-function
					target: targetProfileName === 'server' ? 'node' : undefined, // See https://stackoverflow.com/questions/43915463/webpack-node-js-http-module-http-createserver-is-not-a-function
					output: {
						path: path.join(dirname, 'dist'), // TODO: Ensure that __dirname has the correct value.
						filename: filename,
						library: gruntfile.shortName,
						// See https://webpack.js.org/configuration/output/#output-librarytarget
						libraryTarget: libraryTarget
					},
					// plugins: [
					// 	new HtmlWebpackPlugin({
					// 		template: 'src/index.html'
					// 	})
					// ],
					module: {
						rules: [
							{
								test: /\.js[x]?$/,
								exclude: /node_modules/,
								use: [
									{
										loader: 'babel-loader',
										// options: getBabelOptions({
										// 	targetProfileName: targetProfileName
										// })
										options: getBabelOptions(babelOptions)
									}
								]
							}
							// ,
							// {
							// 	test: /.css$/,
							// 	loader: "style-loader!css-loader"
							// }
						]
					} //,
					// devtool: 'source-map'
				};
			};

			const initGruntConfigOptions = {
				pkg: gruntfile,
				eslint: {
					target: [
						'*.js',
						'src/*.js',
						'test/*.js'
					]
				},
				nodeunit: {
					all: ['test/*_test.js']
				},
				webpack: {
					// Possible values for libraryTarget: See https://webpack.js.org/configuration/output/#output-librarytarget :
					// amd, amd-require, assign, commonjs, commonjs2, global, jsonp, this, umd, var, window.
					prodserver: getWebpackConfig('production', 'server'),
					prodclient: getWebpackConfig('production', 'client')
				}
			};

			if (isConcatNeeded) {
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

			grunt.initConfig(initGruntConfigOptions);

			// Tasks

			if (isConcatNeeded) {
				grunt.loadNpmTasks('grunt-contrib-concat');
			}

			if (nodeunit) {
				grunt.loadNpmTasks('grunt-contrib-nodeunit');
			}

			grunt.loadNpmTasks('grunt-eslint');
			grunt.loadNpmTasks('grunt-webpack');

			/*
			const buildTasks = [
				'webpack:prodserver',
				'webpack:prodclient',
				'concat'
			];
			 */
			let buildTasks;

			if (isConcatNeeded) {
				buildTasks = [
					'webpack:prodserver',
					'webpack:prodclient',
					'concat'
				];
			} else if (forClient) {
				buildTasks = ['webpack:prodclient'];
			} else if (forServer) {
				buildTasks = ['webpack:prodserver'];
			} else {
				buildTasks = [];
			}

			// Aliases
			grunt.registerTask('build', buildTasks);

			let testTasks = ['eslint'];
			let defaultTasks = ['eslint', 'build'];

			if (nodeunit) {
				const strNodeunit = 'nodeunit';

				testTasks.push(strNodeunit);
				defaultTasks.push(strNodeunit);
			}

			grunt.registerTask('test', testTasks);
			grunt.registerTask('default', defaultTasks);
		}
	},
	version: require('../package.json').version
};
