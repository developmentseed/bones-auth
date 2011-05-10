// AuthList
// --------
// Base class for Auth-based collections. See server-side overrides below.
model = Backbone.Collection.extend({
    model: models.User
});

model.title = 'AuthList';
