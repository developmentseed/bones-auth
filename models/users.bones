// Users
// -----
// Collection of all users.
model = models.AuthList.extend({
    model: models.User,
    url: '/api/user',
    comparator: function(model) {
        return model.id.toLowerCase();
    }
});
