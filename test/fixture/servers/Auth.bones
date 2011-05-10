server = Bones.Server.extend();

server.prototype.initialize = function() {
    routers['Auth'].register(this);
};
