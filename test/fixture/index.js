var plugin = module.exports = require('bones').plugin(__dirname);


var cache = {
    // Root user fixture
    'root': {
        id: 'root',
        password: '77d45868cf03167b44618aee53bad94c60b58744643bdd30e46f541b63df20c5'
    }
};

require('bones').Backbone.sync = function(method, model, success, error) {
    if (method === 'read') {
        if (model.id && model.id in cache) return success(cache[model.id]);
    }

    error();
};


plugin.load(require('../..'));
plugin.load();

if (!module.parent) {
    plugin.start();
}
