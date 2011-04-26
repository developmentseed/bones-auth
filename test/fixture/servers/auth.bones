server = Bones.Server.extend();

server.prototype.initialize = function() {
    this.register(routers['Auth'], {
        secret: '4b6be4b408195388def323740e7cc20053fa6f57f46faf57816a99ae2a257af2'
    });
};
