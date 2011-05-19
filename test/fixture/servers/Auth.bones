server = Bones.Server.augment({
    middleware: function(parent, plugin) {
        parent.apply(this, arguments);
        routers['Auth'].register(this);
    }
});

