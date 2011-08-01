var crypto = require('crypto'),
    email = require('email');

// Note: this secret may not depend on the model instance!
models['User'].secret = function() {
    return Bones.plugin.config.secret;
};

models['User'].hash = function(string) {
    return crypto.createHmac('sha256', this.secret()).update(string).digest('hex');
};

// Override sync for User model. Filters out passwords server side
// such that they are never returned to the client. The `password`
// property is preserved on the model instance enabling authentication
// code to access the password directly.
//
// When overridding this method with a custom sync, make sure to include
// the password filtering logic. @TODO: better way of ensuring this override
// occurs on extending models.
models['User'].augment({
    sync: function(parent, method, model, options) {
        var options = options || {};
        var success = options.success,
            error = options.error;

        // Don't write the passwordConfirm attribute.
        model.unset('passwordConfirm', { silent: true });
        // Filter out `resp.password`.
        options.success = function(resp) {
            var filtered = _(resp).clone();
            if (method === 'read' && _(filtered.password).isString()) {
                model.password = filtered.password;
                delete filtered.password;
            } else if (method === 'create' || method === 'update') {
                filtered.password = undefined;
            }
            success(filtered);
        };
        Backbone.sync(method, model, options);
    }
});
