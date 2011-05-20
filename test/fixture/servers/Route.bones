servers.Route.augment({
    initialize: function(parent, app) {
        this.get('/reset-password/*', function(req, res, next) {
            res.send('Successfully logged in!');
        });
        parent.call(this, app);
    }
})