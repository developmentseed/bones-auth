var crypto = require('crypto'),
    fs = require('fs');

command = Bones.Command.extend({});

command.description = 'user management';
command.usage = 'list | add <id> <password> | del <id>';

command.prototype.initialize = function(plugin, callback) {
    var action = plugin.argv._[1];
    if (this[action]) {
        this[action].command(plugin.argv, callback);
    } else {
        plugin.help(callback);
    }
};

command.prototype.list = {
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
                callback && callback();
            },
            error: function(collection, err) {
                console.error('%s', err);
                callback && callback();
            }
        });
    }
};

command.prototype.add = {
    name: 'user add <username> <password>',
    description: 'create a new user account',
    command: function(argv, callback) {
        if (argv._[2] && argv._[3]) {
            argv._[3] = models.User.hash(argv._[3]);
            var user = new models.User({id: argv._[2], password: argv._[3]});
            user.save({}, {
                success: function(model, resp) {
                    console.log('User %s created', argv._[2]);
                    callback && callback();
                },
                error: function(model, err) {
                    console.error('%s', err);
                    callback && callback();
                }
            });
        } else {
            console.log('Usage: %s %s', argv.$0, this.name);
        }
    }
};

command.prototype.del = {
    name: 'user del <username>',
    description: 'delete a user account',
    command: function(argv, callback) {
        if (argv._[1]) {
            var user = new models.User({id: argv._[2]});
            user.destroy({
                success: function(model, resp) {
                    console.log('User %s deleted', argv._[2]);
                    callback && callback();
                },
                error: function(model, err) {
                    console.error('%s', err);
                    callback && callback();
                }
            });
        }
    }
};

