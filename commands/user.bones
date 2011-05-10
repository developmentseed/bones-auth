var crypto = require('crypto'),
    fs = require('fs');

command = Bones.Command.extend({
    description: 'User management',

    initialize: function(plugin) {
        var action = plugin.argv._[1];
        if (this[action]) {
            this[action].command(plugin.argv, function() {
                // TODO: something to indicate completion?
            });
        } else {
            // TODO: show usage information
        }
    },

    list: {
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
                    console.warn(err);
                    console.log('Error: %s', resp);
                    callback();
                }
            });
        }
    },

    add: {
        name: 'user add <username> <password>',
        description: 'create a new user account',
        command: function(argv, callback) {
            if (argv._[2] && argv._[3]) {
                var pass = models.User.hash('' + argv._[3]);

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
            } else {
                console.log('Usage: %s %s',argv.$0, this.name);
            }
        }
    },

    del: {
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
});
