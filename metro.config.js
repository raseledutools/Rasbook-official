// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Tree-shaking: exclude native-only modules on web
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Reduce bundle size: minify on production
config.transformer.minifierConfig = {
  compress: {
    drop_console: true,   // remove console.log in production
    reduce_vars: true,
  },
};

module.exports = config;
