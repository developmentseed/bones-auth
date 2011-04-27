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
        options = options || {};
        this.admin = options.admin || null;
        this.context = options.context || $('#bonesAdminToolbar > .auth');
        this.render().trigger('attach');
    },
    render: function() {
        $(this.el).html(this.template('AdminFormLogin', this.model));
        return this;
    },
    attach: function () {
        this.context.prepend(this.el);
        return this;
    },
    auth: function() {
        this.model.authenticate('login', {
            id: this.$('input[name=username]').val(),
            password: this.$('input[name=password]').val()
        }, { error: this.error });
        this.$('input[name=username], input[name=password]').val('');
        return false;
    }
});
