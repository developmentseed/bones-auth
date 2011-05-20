require('bones').plugin.config.secret = '4b6be4b408195388def323740e7cc20053fa6f57f46faf57816a99ae2a257af2';
require('bones').Command.options['secret'] = {};

var store = {
    // Root user fixture
    '/api/User/root': {
        id: 'root',
        email: 'test@example.com',
        password: '77d45868cf03167b44618aee53bad94c60b58744643bdd30e46f541b63df20c5'
    },
    // User with no email address
    '/api/User/noemail': {
        id: 'noemail',
        password: '77d45868cf03167b44618aee53bad94c60b58744643bdd30e46f541b63df20c5'
    },
    // Invalid email address
    '/api/User/invalidemail': {
        id: 'invalidemail',
        email: 'so not a valid email address!',
        password: '77d45868cf03167b44618aee53bad94c60b58744643bdd30e46f541b63df20c5'
    },
    '/api/User/resetpassword': {
        id: 'resetpassword',
        email: 'test@example.com',
        // Unknown password
        password: 'd6654ad03a87f411cefc969f4e6d59310772c0a44188e60c9d910ae1b07cf46f'
    }
};

require('bones').Backbone.sync = function(method, model, success, error) {
    var id = (typeof model.url === 'function') ? model.url() : model.url;
    if (!id) return error('URL required');

    if (method === 'read' && model.id) {
        return store[id]? success(store[id]) : error('Model not found.');
    } else if (method === 'read') {
        return success(Object.keys(store)
            .filter(function(key) { return key.indexOf(id) === 0; })
            .map(function(key) { return store[key]; }));
    } else if (method === 'create' || method === 'update') {
        store[id] = model.toJSON();
    } else if (method === 'delete') {
        delete store[id];
    }
    success({});
};


require('../..');
require('bones').load(__dirname);

if (!module.parent) {
    require('bones').start();
}
