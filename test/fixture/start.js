// Load application.
require('./');

process.argv[2] = 'start';
module.exports = require('bones').start();
