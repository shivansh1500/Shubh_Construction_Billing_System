const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to be within the backend directory
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
