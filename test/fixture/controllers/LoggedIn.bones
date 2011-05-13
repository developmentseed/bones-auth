controller = Backbone.Controller.extend({
    routes: {
        '/loggedin': 'loggedin',
        '/model': 'model'
    },

    loggedin: function() {
        this.res.send(JSON.stringify(this.req.session || false), 200);
    },

    model: function() {
        this.res.send(JSON.stringify({
            isModel: this.req.session.user instanceof models.User
        }), 200);
    }
});
