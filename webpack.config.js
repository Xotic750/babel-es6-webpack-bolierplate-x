/**
 * @file Manages the root configuration settings for webpack.
 * @module webpack/root/configuration
 * @see {@link https://webpack.js.org/} for further information.
 */

const path = require('path');
const webpack = require('webpack');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const eslintFriendlyFormatter = require('eslint-friendly-formatter');
const {
  BundleAnalyzerPlugin,
} = require('webpack-bundle-analyzer');

/**
 * The NODE_ENV environment variable.
 * @type {!Object}
 */
const {
  NODE_ENV,
} = process.env;

/**
 * The production string.
 * @type {string}
 */
const PRODUCTION = 'production';

/**
 * The development string.
 * @type {string}
 */
const DEVELOPMENT = 'development';

/**
 * The default exclude regex.
 * @type {string}
 */
const DEFAULT_EXCLUDE_RX = /node_modules/;

/**
 * For polyfilling the Fetch API if required.
 * @type {string}
 *
 * https://github.com/github/fetch
 * https://github.com/webpack-contrib/imports-loader
 * https://github.com/webpack-contrib/exports-loader
 * https://webpack.js.org/guides/migrating/#automatic-loader-module-name-extension-removed
 * */
const WHATWG_FETCH = 'imports-loader?this=>global!exports-loader?global.fetch!whatwg-fetch';

const DEFAULT_ENV = {
  report: false,
};

/**
 * Allows you to pass in as many environment variables as you like using --env.
 *
 * @param {!Object} env - The env object.
 * @see {@link https://webpack.js.org/guides/environment-variables/}
 */
module.exports = (env = DEFAULT_ENV) => {
  return {
    context: path.resolve(__dirname, '.'),

    /**
     * This option controls if and how source maps are generated.
     *
     * nosources-source-map - A SourceMap is created without the sourcesContent in it.
     * It can be used to map stack traces on the client without exposing all of the
     * source code. You can deploy the Source Map file to the web-server.
     *
     * eval-source-map - Each module is executed with eval() and a SourceMap is added as
     * a DataUrl to the eval(). Initially it is slow, but it provides fast rebuild speed
     * and yields real files. Line numbers are correctly mapped since it gets mapped to
     * the original code. It yields the best quality SourceMaps for development.
     *
     * source-map - A full SourceMap is emitted as a separate file. It adds a reference
     * comment to the bundle so development tools know where to find it.
     *
     * @type {string}
     * @see {@link https://webpack.js.org/configuration/devtool/}
     */
    devtool: NODE_ENV === PRODUCTION ? 'source-map' : 'eval-source-map',

    /**
     * Define the entry points for the application.
     * @type {array.<string>}
     * @see {@link https://webpack.js.org/concepts/entry-points/}
     */
    entry: [path.join(__dirname, 'src/index.js')],

    // mode: NODE_ENV === PRODUCTION ? PRODUCTION : DEVELOPMENT,

    /**
     * In modular programming, developers break programs up into discrete chunks of functionality
     * called a module. Each module has a smaller surface area than a full program, making verification,
     * debugging, and testing trivial. Well-written modules provide solid abstractions and encapsulation
     * boundaries, so that each module has a coherent design and a clear purpose within the overall
     * application.
     *
     * webpack supports modules written in a variety of languages and preprocessors, via loaders.
     * Loaders describe to webpack how to process non-JavaScript modules and include these dependencies
     * into your bundles.
     *
     * @type {array.<!Object>}
     * @see {@link https://webpack.js.org/configuration/module/#module-rules}
     */
    module: {
      rules: [
        /**
         * eslint-loader options.
         * @type {!Object}
         * @see {@link https://github.com/MoOx/eslint-loader}
         */
        {
          enforce: 'pre',
          exclude: DEFAULT_EXCLUDE_RX,
          loader: 'eslint-loader',
          options: {
            emitError: true,
            emitWarning: false,
            failOnError: true,
            failOnWarning: false,
            formatter: eslintFriendlyFormatter,
            quiet: true,
          },
          test: /\.(js|json)$/,
        },

        /**
         * This package allows transpiling JavaScript files using Babel and webpack.
         * @type {!Object}
         * @see {@link https://webpack.js.org/loaders/babel-loader/}
         */
        {
          exclude: DEFAULT_EXCLUDE_RX,
          loader: 'babel-loader',
          options: {
            plugins: ['lodash'],
            presets: [['env', {
              modules: false,
              targets: {
                node: 8,
              },
            }]],
          },
          test: /\.js$/,
        },
      ],
    },

    // prevent webpack from injecting mocks to Node native modules
    // that does not make sense for the client
    node: {
      child_process: 'empty',
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      // prevent webpack from injecting useless setImmediate polyfill.
      setImmediate: false,
      tls: 'empty',
    },

    /**
     * Configuring the output configuration options tells webpack how to write the compiled
     * files to disk.
     * @type {!Object}
     * @see {@link https://webpack.js.org/configuration/output/}
     */
    output: {
      filename: 'index.js',
      library: 'returnExports',
      libraryTarget: 'umd',
      path: path.resolve(__dirname, 'dist'),
    },

    /**
     * Plugins are the backbone of webpack. webpack itself is built on the same plugin system
     * that you use in your webpack configuration!
     *
     * A webpack plugin is a JavaScript object that has an apply property. This apply property
     * is called by the webpack compiler, giving access to the entire compilation lifecycle.
     *
     * @type {array.<!Object>}
     */
    plugins: [
      /**
       * Use the shorthand version.
       * @type {!Object}
       * @see {@link https://webpack.js.org/plugins/environment-plugin/}
       */
      new webpack.EnvironmentPlugin({
        DEBUG: false, // use 'false' unless process.env.DEBUG is defined.
        NODE_ENV: DEVELOPMENT, // use 'development' unless process.env.NODE_ENV is defined.
      }),

      /**
       * Fetch polyfill for environments that are missing the API.
       * Only loads if required.
       * @type {!Object}
       * @see {@link https://webpack.js.org/plugins/provide-plugin/
     */
      new webpack.ProvidePlugin({
        fetch: WHATWG_FETCH,
        'window.fetch': WHATWG_FETCH,
      }),

      /**
       * Smaller lodash builds. We are not opting in to path feature.
       * @type {!Object}
       * @see {@link https://github.com/lodash/lodash-webpack-plugin}
       */
      new LodashModuleReplacementPlugin({
        paths: true,
      }),

      /**
       * This plugin uses UglifyJS v3 (uglify-es) to minify your JavaScript.
       * @type {!Object}
       * @see {@link https://webpack.js.org/plugins/uglifyjs-webpack-plugin/}
       */
      ...(NODE_ENV === PRODUCTION ? [new webpack.optimize.UglifyJsPlugin({
        parallel: true,
        sourceMap: true,
        uglifyOptions: {
          ecma: 8,
        },
      })] : []),

      /**
       * Webpack plugin and CLI utility that represents bundle content as convenient
       * interactive zoomable treemap.
       * @type {!Object}
       * @see {@link https://github.com/webpack-contrib/webpack-bundle-analyzer}
       */
      ...(env.report ? [new BundleAnalyzerPlugin()] : []),
    ],

    /**
     * These options change how modules are resolved.
     * @type {!Object}
     * @see {@link https://webpack.js.org/configuration/resolve/}
     */
    resolve: {
      /**
       * Create aliases to import or require certain modules more easily.
       * @type {!Object}
       * @see {@link https://webpack.js.org/configuration/resolve/#resolve-alias}
       */
      alias: {
        RootDir: path.resolve(__dirname, '.'),
        src: path.resolve(__dirname, 'src'),
      },
      extensions: ['.js', '.json'],
    },
  };
};
