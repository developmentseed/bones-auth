var crypto = require('crypto'),
    fs = require('fs');

command = Bones.Command.extend();

command.description = 'User management';

command.prototype.initialize = function(plugin) {
    var secret = plugin.config.secret;

    // need to initialize the servers, to register connections to the db.
    var servers = {};
    for (var server in plugin.servers) {
        servers[server] = new plugin.servers[server](plugin);
    }

    var actions = {
        'list': {
            name: 'user list',
            description: 'list all users',
            command: function(argv, callback) {
                var users = new models.Users();
                users.fetch({
                    success: function(collection, resp) {
                        if (collection.length) {
                            console.log('Users:');
                            collection.each(function(model) {
                                console.log('  ' + model.get('id'));
                            });
                        } else {
                            console.log('No users found.');
                        }
                        callback();
                    },
                    error: function(resp) {
                        console.log('Error: %s', resp);
                        callback();
                    }
                });
            }
        },
        'add': {
            name: 'user add <username> <password>',
            description: 'create a new user account',
            command: function(argv, callback) {
                if (argv._[2] && argv._[3]) {
                    var pass = crypto.createHmac('sha256', secret.salt)
                       .update('' + argv._[3]).digest('hex');

                    var user = new models.User({id: argv._[2], password: pass});
                    user.save({}, {
                        success: function(model, resp) {
                            console.log('User %s created', argv._[2]);
                            callback();
                        },
                        error: function(resp) {
                            console.log('Error: %s', resp);
                            callback();
                        }
                    });
                }
            }
        },
        'del': {
            name: 'user del <username>',
            description: 'delete a user account',
            command: function(argv, callback) {
                if (argv._[1]) {
                    var user = new models.User({id: argv._[2]});
                    user.destroy({
                        success: function(model, resp) {
                            console.log('User %s deleted', argv._[2]);
                            callback();
                        },
                        error: function(resp) {
                            console.log('Error: %s', resp);
                            callback();
                        }
                    });
                }
            }
        }
    };

    actions[plugin.argv._[1]] && actions[plugin.argv._[1]].command(plugin.argv, console.log);
}

