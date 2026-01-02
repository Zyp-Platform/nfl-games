const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

// SPA_NAME must use underscores (no hyphens) - validated by spa-validator
const SPA_NAME = 'nfl_games';
const SPA_PORT = process.env.NFL_GAMES_FRONTEND_PORT || 3205;

// =============================================================================
// SHARED DEPS - Versions MUST match pnpm-workspace.yaml catalog exactly
// Source of truth: /pnpm-workspace.yaml → catalog section
// =============================================================================
const SHARED_DEPS = {
  react: { singleton: true, requiredVersion: '19.2.0', eager: true },
  'react-dom': { singleton: true, requiredVersion: '19.2.0', eager: true },
  'react-router-dom': { singleton: true, requiredVersion: '7.9.4', eager: true },
  zustand: { singleton: true, requiredVersion: '5.0.2', eager: true },
};

// Entry points MUST match manifest.json - validated by spa-validator
const EXPOSES = {
  './PublicHome': './src/dashboards/PublicHome.tsx',
  './MemberHome': './src/dashboards/MemberHome.tsx',
  './CommissionerHome': './src/dashboards/CommissionerHome.tsx',
};

const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'static/js/[name].[contenthash].js',
    chunkFilename: 'static/js/[name].[contenthash].js',
    publicPath: 'auto',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/images/[name].[hash][ext]',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/fonts/[name].[hash][ext]',
        },
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: SPA_NAME,
      filename: 'remoteEntry.js',
      exposes: EXPOSES,
      shared: SHARED_DEPS,
    }),
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
    }),
    ...(isDev ? [] : [
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash].css',
        chunkFilename: 'static/css/[name].[contenthash].css',
      }),
    ]),
  ],
  devServer: {
    port: SPA_PORT,
    hot: true,
    historyApiFallback: true,
    headers: {
      // CORS headers REQUIRED for Module Federation
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    proxy: [
      {
        context: ['/api'],
        target: process.env.NFL_GAMES_API_URL || 'http://localhost:3206',
        changeOrigin: true,
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'async', // Don't break MF shared deps
    },
  },
  performance: {
    hints: isDev ? false : 'warning',
    maxAssetSize: 512000,
    maxEntrypointSize: 512000,
  },
};
