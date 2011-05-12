controller = Backbone.Controller.extend({
    routes: {
        '/loggedin': 'loggedin'
    },

    loggedin: function() {
        this.res.send(JSON.stringify(this.req.session || false), 200);
    }
});
