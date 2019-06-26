// thaw-config/src/main.js

'use strict';

// module.exports = (options = {}) => {
module.exports = {
	babel: {
		client: require('../config/babel-targets-client-side'),
		server: require('../config/babel-targets-server-side')
	},
	version: require('../package.json').version
};
