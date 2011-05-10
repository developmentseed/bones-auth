// AdminLogin
// ----------
// View. Login form that integrates with `bones-admin` toolbar as an auth view.
view = Backbone.View.extend({
    admin: null,

    context: null,

    events: {
        'click input[type=submit]': 'auth'
    },

    initialize: function(options) {
        _.bindAll(this, 'render', 'attach', 'auth');
        _.defaults(this, options || {}, {
            context: $('#bonesAdminToolbar > .auth')
        });

        // TODO: there's no event for unattachment
        this.model.unbind('auth:error');
        this.model.bind('auth:error', function(model, error) {
            // TODO: implement better error message handling.
            alert(error.error);
        });

        this.render().trigger('attach');
    },

    render: function() {
        $(this.el).html(templates['AdminFormLogin'](this.model));
        return this;
    },

    attach: function () {
        this.context.prepend(this.el);
        return this;
    },

    auth: function() {
        this.model.login({
            id: this.$('input[name=username]').val(),
            password: this.$('input[name=password]').val()
        });
        return false;
    }
});
