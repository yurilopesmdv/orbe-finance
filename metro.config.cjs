const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  // Exclude from the file map too: symbolication must not read private files.
  /(?:^|[\\/])(?:\.env(?:[.][^\\/]*)?|backend\.env(?:[.][^\\/]*)?|credentials\.json(?:[.][^\\/]*)?|\.npmrc(?:[.][^\\/]*)?)(?:$|[\\/])/,
];
module.exports = config;
