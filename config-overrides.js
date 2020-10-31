const {
    override,
    addBabelPlugin,
    addWebpackPlugin,
    addWebpackModuleRule,
} = require("customize-cra");
const path = require('path');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const paths = require('react-scripts/config/paths');
const getClientEnvironment = require('react-scripts/config/env');
const resolve = require('resolve');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');

const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== 'false';

const node_env = process.env.NODE_ENV;
const isEnvProduction = node_env === 'production';
const isEnvDevelopment = node_env === 'development';

function build_page_plugin(env, template, filename, chunks) {
    const isEnvProduction = env === 'production';
    return new HtmlWebpackPlugin(
        Object.assign(
            {},
            {
                inject: true,
                chunks,
                template: path.join(__dirname, template),
                filename,
            },
            isEnvProduction
                ? {
                    minify: {
                        removeComments: true,
                        collapseWhitespace: true,
                        removeRedundantAttributes: true,
                        useShortDoctype: true,
                        removeEmptyAttributes: true,
                        removeStyleLinkTypeAttributes: true,
                        keepClosingSlash: true,
                        minifyJS: true,
                        minifyCSS: true,
                        minifyURLs: true,
                    },
                }
            : undefined
        )
    );
}

function rewriteEntries(config) {
    return {
        ...config,
        entry: {
            main: isEnvDevelopment ? [
                require.resolve('react-dev-utils/webpackHotDevClient'),
                './src/index',
            ] : [ './src/index' ],
            worker: './src/worker'
        }
    };
}

function multiplexOutput(config) {
    return {
        ...config,
        output: {
            ...config.output,
            filename: isEnvProduction
                ? 'static/js/[name].[contenthash:8].js'
                : isEnvDevelopment && 'static/js/[name].bundle.js',
        }
    };
}

// Webpack uses `publicPath` to determine where the app is being served from.
// It requires a trailing slash, or the file assets will get an incorrect path.
// In development, we always serve from the root. This makes config easier.
const publicPath = isEnvProduction
      ? paths.servedPath
      : isEnvDevelopment && '/';

// `publicUrl` is just like `publicPath`, but we will provide it to our app
// as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
// Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
const publicUrl = isEnvProduction
      ? publicPath.slice(0, -1)
      : isEnvDevelopment && '';

// Get environment variables to inject into our app.
const environ = getClientEnvironment(publicUrl);

const sandboxUrl = isEnvProduction ? 'http://wcld-sandbox.emallson.net' : environ.raw['PUBLIC_URL'];

environ.raw['SANDBOX_URL'] = sandboxUrl;

module.exports = override(
    rewriteEntries,
    addWebpackPlugin(build_page_plugin(node_env, './public/index.html', 'index.html', ['main'])),
    addWebpackPlugin(build_page_plugin(node_env, './public/worker.html', 'worker.html', ['worker'])),
    multiplexOutput,
    isEnvDevelopment && addBabelPlugin(require.resolve('react-refresh/babel')),
    isEnvDevelopment && addWebpackPlugin(new ReactRefreshPlugin()),
                // Inlines the webpack runtime script. This script is too small to warrant
                // a network request.
                isEnvProduction &&
                    shouldInlineRuntimeChunk &&
                    addWebpackPlugin(new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime~.+[.]js/])),
    addWebpackPlugin(new InterpolateHtmlPlugin(HtmlWebpackPlugin, environ.raw)),
    addWebpackModuleRule({
        test: /\.worker\.js$/,
        use: [
            { loader: 'worker-loader' },
        ],
    }),
);
