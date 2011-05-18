controller = Backbone.Controller.extend({
    routes: {
        '/reset-password' : 'resetPassword',
        '/reset-password/:token': 'authToken'
    },
    send: function(out) {
        this.res && this.res.send(out);
    },

    resetPassword: function() {
        var view = new views.ResetPassword({
            title: 'Reset password',
            model: new models.User()
        });
        this.send(new views.App({view: view}).el);
    },
    authToken: function(token) {

    },
});
