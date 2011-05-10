models['User'].augment({
    sync: function(parent, method, model, success, error) {
        model.unset('passwordConfirm', { silent: true });
        return (parent || Backbone.sync)(method, model, success, error);
    }
});
