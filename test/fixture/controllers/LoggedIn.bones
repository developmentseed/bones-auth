controller = Backbone.Controller.extend({
    routes: {
        '/session': 'session',
        '/model': 'model'
    },

    session: function() {
        this.res.send(JSON.stringify(this.req.session || false), 200);
    },

    model: function() {
        this.res.send(JSON.stringify({
            isAuthenticated: (
                this.req.session &&
                this.req.session.user &&
                this.req.session.user.authenticated
            ),
            isModel: (
                this.req.session &&
                this.req.session.user instanceof models.User
            )
        }), 200);
    }
});
