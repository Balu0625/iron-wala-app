
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [
    ...config.resolver.sourceExts,
    'mjs',
    'ios.js',
    'android.js',
    'native.js',
];

module.exports = config;
