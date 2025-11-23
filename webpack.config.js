const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './dokuly/frontend/src/index.js',
  output: {
    path: path.resolve(__dirname, 'dokuly/frontend/static/frontend'),
    filename: 'main.js',
    clean: {
      keep: /\.(wasm|hdr)$/,
    },
  },
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dokuly/frontend/static'),
      },
      {
        directory: path.join(__dirname, 'node_modules/pdfjs-dist/build'),
        publicPath: '/pdfjs-dist/build',
      },
    ],
    port: 3000,
    hot: true,
    liveReload: true,
    watchFiles: ['dokuly/frontend/src/**/*'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: 'defaults' }],
              ['@babel/preset-react', { runtime: 'automatic' }]
            ],
            plugins: [
              'babel-plugin-transform-class-properties'
            ]
          }
        }
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.hdr$/,
        use: [
          {
            loader: 'file-loader',
            options: {},
          },
        ],
      },
      {
        test: /pdf\.worker\.(min\.)?js/,
        type: 'asset/resource',
        generator: {
          filename: 'pdf.worker.min.js',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'dokuly/frontend/src'),
    }
  },
  plugins: [
    new NodePolyfillPlugin(),
  ],
  target: ['web', 'es5'],
};