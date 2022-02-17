const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
// const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
	mode: 'development',
	entry: {
		start: './src/start.js',
		controller_debug: './src/controller_debug.js',
	},
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
		],
	},
	devServer: {
		https: true,
		host: '0.0.0.0',
		contentBase: path.join(__dirname, 'dist'),
		compress: true,
		port: 9000,
	},
	output: {
		filename: '[name].bundle.js',
		path: path.join(__dirname, 'dist'),
		clean: true,
	},
	plugins: [
		new ESLintPlugin(),
		new HtmlWebpackPlugin({
			filename: 'start.html',
			template: './src/start.html',
			chunks: ['start'],
		}),
		new HtmlWebpackPlugin({
			filename: 'controller_debug.html',
			template: './src/controller_debug.html',
			chunks: ['controller_debug'],
		}),
		// new CopyPlugin({
		// 	patterns: [{ from: 'src/assets', to: 'assets' }],
		// }),
	],
	devtool: 'source-map',
};
