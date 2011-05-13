var crypto = require('crypto'),
    email = require('email');

models['User'].secret = function() {
    return Bones.plugin.config.secret;
};

models['User'].hash = function(string) {
    return crypto.createHmac('sha256', this.secret()).update(string).digest('hex');
};

models['User'].augment({
    sync: function(parent, method, model, success, error) {
        model.unset('passwordConfirm', { silent: true });
        if (method === 'read' && Bones.plugin.config.adminParty) {
            success(model);
            return;
        } else {
            Backbone.sync(method, model, success, error);
        }
    }
});


// Override parse for Auth model. Filters out passwords server side
// such that they are never returned to the client. The `password`
// property is preserved on the original response object enabling
// authentication code to access the response directly.
models['User'].prototype.parse = function(resp) {
    var filtered = _.clone(resp);
    !_.isUndefined(filtered.password) && (delete filtered.password);
    return filtered;
};
