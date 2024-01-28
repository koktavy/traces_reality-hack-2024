const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    devtool: 'source-map',
    resolve: {
        fallback: {
            'fs': false,
            'path': false,
            'os': false,
            // add any other Node.js-only packages that you're using here
        }
    }
})