// Users
// -----
// Collection of all users.
model = Backbone.Collection.extend({
    model: models.User,
    url: '/api/User',
    comparator: function(model) {
        return model.id.toLowerCase();
    }
});
