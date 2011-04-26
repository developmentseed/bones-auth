// AuthList
// --------
// Base class for Auth-based collections. See server-side overrides below.
model = Backbone.Collection.extend({
    model: models.Auth
});

model.title = 'AuthList';
