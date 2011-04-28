#!/usr/bin/env node
var plugin = module.exports = require('bones').plugin(__dirname);

plugin.load(require('bones-admin'));
plugin.load();
