var cache = {
    // Root user fixture
    'root': {
        id: 'root',
        password: '77d45868cf03167b44618aee53bad94c60b58744643bdd30e46f541b63df20c5'
    }
};

require('bones').Backbone.sync = function(method, model, success, error) {
    if (method === 'read') {
        if (model.id && model.id in cache) {
            return success(cache[model.id]);
        }
    }

    error();
};

require('bones-auth');
require('bones').load(__dirname);

if (!module.parent) {
    require('bones').start();
}
