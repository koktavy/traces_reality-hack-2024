const path = require('path')
const DotenvWebpackPlugin = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/index.ts',
    module: {
        rules: [
            {
              test: /\.html$/,
              use: 'html-loader',
            },
            {
              test: /\.tsx?$/,
              use: 'ts-loader',
              exclude: /node_modules/,
            },
            {
              test: /\.hdr$/,
              use: 'file-loader'
            },
            {
              test: /\.jpg$/,
              use: 'file-loader'
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html',
        }),
    ],
    performance: {
      hints: process.env.NODE_ENV === 'production' ? "warning" : false,
    }
}