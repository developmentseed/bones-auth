server = Bones.Server.extend();

server.prototype.initialize = function() {
    routers['Auth'].register(this);
    routers['AuthEmail'].register(this);
    routers['Core'].register(this);
    models['User'].register(this);
    models['Users'].register(this);
    controllers['LoggedIn'].register(this);
};
