servers.Middleware.augment({
    initialize: function(parent, app) {
        parent.call(this, app);
        this.use(new servers['Auth'](app));
    }
});
