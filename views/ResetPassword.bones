// ResetPassword
// -------------
view = Backbone.View.extend({
    className: 'admin',
    events: {
        'click input[type=submit]': 'submit'
    },
    initialize: function (options) {
        _.bindAll(this, 'render', 'submit');
        this.render();
    },
    render: function() {
        $(this.el).empty().append(templates['ResetPassword'](this.model));
        return this;
    },
    submit: function() {
        var that = this;
        var params = {
            id: encodeURIComponent(this.model.id || this.$('input[name=id]').val()),
            success: function(resp) {
                var resp = resp || {message: 'Reset password'};
                new views.AdminGrowl(resp);
                that.route('/');
            },
            error: function(resp) {
                new views.AdminGrowl({
                    'message': 'Unknown user',
                    'classes': 'error'
                });
            }
        };
        params.id && this.model.resetPassword(params);
        return false;
    }
});

