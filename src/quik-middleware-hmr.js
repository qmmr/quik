'use strict';

const expand = require('glob-expand');
const compose = require('koa-compose');
const webpack = require('webpack');
const webpackDevMiddleware = require('koa-webpack-dev-middleware');
const webpackHotMiddleware = require('koa-webpack-hot-middleware');
const config = require('./webpack-config');

module.exports = function(options) {
    const WORKINGDIR = options.root;

    const loaders = config.module.loaders.slice();

    for (let i = 0, l = loaders.length; i < l; i++) {
        const loader = loaders[i];

        if (loader.loader === 'babel-loader' || loader.loader === 'babel') {
            loaders[i] = Object.assign({}, loader, {
                query: Object.assign({}, loader.query, {
                    presets: [
                        ...loader.query.presets,
                        require.resolve('babel-preset-react-hmre')
                    ]
                })
            });
        } else if (loader.loaders && (loader.loaders.indexOf('babel-loader') > -1 || loader.loaders.indexOf('babel') > -1)) {
            // TODO: use babel-preset-react-hmre
            loader.loaders.unshift('react-hot');
        }
    }

    const expanded = expand({ cwd: WORKINGDIR }, options.entry);
    const entry = {};

    for (let e of expanded) {
        entry[e] = [ './' + e, 'webpack-hot-middleware/client' ];
    }

    const compiler = webpack(Object.assign({}, config, {
        entry,
        context: WORKINGDIR,
        output: {
            path: WORKINGDIR,
            publicPath: '/',
            filename: '[name]'
        },
        plugins: [].concat(config.plugins, [ new webpack.HotModuleReplacementPlugin() ]),
        module: { loaders }
    }));

    return compose([
        webpackDevMiddleware(compiler, {
            publicPath: '/',
            noInfo: true
        }),
        webpackHotMiddleware(compiler)
    ]);
};
