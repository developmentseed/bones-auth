// Override sync for Users collection. Filters out passwords server side
// such that they are never returned to the client.
//
// When overridding this method with a custom sync, make sure to include
// the password filtering logic. @TODO: better way of ensuring this override
// occurs on extending models.
models['Users'].prototype.sync = function(method, model, success, error) {
    // Filter out `resp.password`.
    var successFilter = function(resp) {
        var filtered = _(resp).clone();
        filtered = filtered.map(function(u) {
            u = _(u).clone();
            delete u.password;
            return u;
        });
        success(filtered);
    };
    Backbone.sync(method, model, successFilter, error);
};
