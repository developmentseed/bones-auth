require('bones').plugin.config.secret = '4b6be4b408195388def323740e7cc20053fa6f57f46faf57816a99ae2a257af2';
require('bones').Command.options['secret'] = {};

var cache = {
    // Root user fixture
    'root': {
        id: 'root',
        email: 'test@example.com',
        password: '77d45868cf03167b44618aee53bad94c60b58744643bdd30e46f541b63df20c5'
    },
    // User with no email address
    'noemail': {
        id: 'noemail',
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
