server = Bones.Server.extend();

server.prototype.initialize = function() {
    routers['Auth'].register(this);
    routers['Core'].register(this);
    controllers['LoggedIn'].register(this);
};
