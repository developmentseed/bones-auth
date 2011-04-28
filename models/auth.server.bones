// Override parse for Auth model. Filters out passwords server side
// such that they are never returned to the client. The `password`
// property is preserved on the original response object enabling
// authentication code to access the response directly.
models['Auth'].prototype.parse = function(resp) {
    var filtered = _.clone(resp);
    !_.isUndefined(filtered.password) && (delete filtered.password);
    return filtered;
};

var config;

// TODO: Find a better way to get config options in a server model.
var originalRegister = models['Auth'].register;
models['Auth'].register = function(server) {
    config = server.plugin.config;
    return originalRegister.apply(this, arguments);
};

models['Auth'].prototype.sync = function(method, model, success, error) {
    if (method === 'read' && config.adminParty) {
        success(model);
        return;
    } else {
        Backbone.sync(method, model, success, error);
    }
};
