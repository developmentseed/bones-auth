// ResetPassword
// -------------
if (views.AdminPopup) view = views.AdminPopup.extend({
    events: _.extend({
        'click input[type=submit]': 'submit'
    }, views.AdminPopup.prototype.events),
    initialize: function (options) {
        _.bindAll(this, 'submit');
        this.content = templates['ResetPassword'](this.model);
        views.AdminPopup.prototype.initialize.call(this, options);
    },
    submit: function() {
        var that = this;
        var params = {
            id: this.model.id || this.$('input[name=id]').val(),
            success: function(resp) {
                var resp = resp || {message: 'Reset password'};
                new views.AdminGrowl(resp);
                that.close();
            },
            error: function(resp) {
                that.admin.error(that.model, resp);
            }
        } 
        params.id && this.model.resetPassword(params);
        return false;
    }
});

