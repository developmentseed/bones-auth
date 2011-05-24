// AdminPopupUser
// --------------
// User account creation/update popup.
if (views.AdminPopup) view = views.AdminPopup.extend({
    events: _.extend({
        'click input[type=submit]': 'submit'
    }, views.AdminPopup.prototype.events),
    initialize: function (options) {
        _.bindAll(this, 'submit');
        this.create = !Boolean(this.model.id);
        this.content = templates['AdminFormUser'](this.model);
        views.AdminPopup.prototype.initialize.call(this, options);
    },
    submit: function() {
        var that = this;
        var params = {
            id: this.model.id || this.$('input[name=id]').val(),
            password: this.$('input[name=password]').val(),
            passwordConfirm: this.$('input[name=passwordConfirm]').val(),
            email: this.$('input[name=email]').val()
        };
        this.model.save(params, {
            success: function() {
                var message = that.create
                    ? 'User ' + that.model.id + ' created.'
                    : 'Saved changes.';
                new views.AdminGrowl({message: message});
                that.close();
            },
            error: that.admin.error
        });
        return false;
    }
});
