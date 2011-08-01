controller = Backbone.Router.extend({
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
        if (token && !Bones.server) {
            Bones.user = Bones.user || new models['User']();
            Bones.user.tokenLogin({token: token})

            // Fix for [IE8 AJAX payload caching][1]. Only applied to authenticated
            // users to allow proxy caching to take effect.
            // [1]: http://stackoverflow.com/questions/1013637/unexpected-caching-of-ajax-results-in-ie8
            Bones.user.bind('auth:status', function(user) {
                $.ajaxSetup({ cache: !user.authenticated });
            });

            location.hash = '!/';
        }
        this.res && this.res.redirect('/#!' + this.req.url);
    }
});
