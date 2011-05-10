var fs = require('fs'),

command = Bones.Command.extend();

command.description = 'User management';

command.prototype.initialize = function(options) {
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
                if (argv._[1] && argv._[2]) {
                    var user = new models.User({id: argv._[2], password: argv._[3]});
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

   actions[options.argv._[1]] && actions[options.argv._[1]].command(options.argv, console.log);
}

