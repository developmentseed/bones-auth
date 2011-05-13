server = Bones.Server.extend();

server.prototype.initialize = function() {
    routers['Auth'].register(this);
    routers['AuthEmail'].register(this);
    routers['Core'].register(this);
    controllers['LoggedIn'].register(this);
};
