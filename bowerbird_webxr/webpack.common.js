const path = require('path')
const DotenvWebpackPlugin = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/index.ts',
    module: {
        rules: [
            {
              test: /\.html$/,
              use: {
                loader: 'html-loader',
                options: {
                  sources: false,
                }
              },
            },
            {
              test: /\.css$/,
              use: ['style-loader', 'css-loader'],
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
              test: /\.(png|jpg)$/,
              use: {
                loader: 'file-loader',
                options: {
                  name: '[name].[ext]', // This configuration retains the original filename and extension
                }
              },
            },
            {
              test: /\.glb$/,
              use: {
                loader: 'file-loader',
                options: {
                  name: '[name].[ext]', // This configuration retains the original filename and extension
                }
              },
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      publicPath: '',
    },
    plugins: [
        new HtmlWebpackPlugin({
          template: './index.html',
        }),
        new CopyPlugin({
          patterns: [
            { from: 'style.css', to: 'style.css' },
            { from: 'src/assets', to: 'assets' },
            { from: 'src/components', to: 'components' },
            { from: 'simple-navmesh-constraint.js', to: 'simple-navmesh-constraint.js' },
            { from: 'model-utils.js', to: 'model-utils.js' },
            { from: 'main.js', to: 'main.js' },
          ],
        }),
    ],
    performance: {
      hints: process.env.NODE_ENV === 'production' ? "warning" : false,
    }
}