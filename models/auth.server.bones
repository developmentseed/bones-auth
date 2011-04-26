// Override parse for Auth model. Filters out passwords server side
// such that they are never returned to the client. The `password`
// property is preserved on the original response object enabling
// authentication code to access the response directly.
models['Auth'].prototype.parse = function(resp) {
    var filtered = _.clone(resp);
    !_.isUndefined(filtered.password) && (delete filtered.password);
    return filtered;
};

// Override sync for Auth model. Hashes passwords when saved to
// persistence.
models['Auth'].prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'create':
    case 'update':
        var authWriteSuccess = function(resp) {
            model.unset('password');
            success(resp);
        };
        var authWriteError = function(resp) {
            model.unset('password');
            error(resp);
        };
        var authWrite = function(data) {
            data.password && model.set(
                {password: data.password},
                {silent: true}
            );
            Backbone.sync(method, model, authWriteSuccess, authWriteError);
        };
        if (model.get('passwordConfirm')) model.unset('passwordConfirm');
        if (model.get('password')) {
            authWrite({ password: hash(model.get('password')) });
        } else {
            Backbone.sync('read', model, authWrite, authWrite);
        }
        break;
    default:
        Backbone.sync(method, model, success, error);
        break;
    }
};
