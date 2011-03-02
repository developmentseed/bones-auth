Bones Auth
----------
Provides base `Auth`, `AuthList`, and `AuthView` (model, collection, view)
classes and `authenticate` Connect middleware for implementing basic
session-based user login with Backbone.js, Bones and Express.

### Tested with

- developmentseed bones master
- documentcloud backbone 0.3.3
- visionmedia express 1.0.7

### Components

- `bones-auth.js`: client side javascript. Contains the mvc classes for any
  client-side `backbone.js` code to reference.
- `bones-auth`: common js module for use with node.js. Includes server-side
  specific overrides to mvc classes as well as other server-side code.

### Usage

#### `Auth`

Abstract model class. Extend it with your own model to create a model which can
be "authenticated". Example:

    var User = Auth.extend({
        url: function() {
            return '/api/User/' + this.id;
        }
    });
    var user = new User();
    user.authenticate('login', {id: 'john', password: 'doe'}, {
        success: function(model, resp) {
            alert('login successful');
        },
        error: function(model, resp) {
            alert('login failed');
        }
    });

#### `AuthList`

Abstract collection class. Extend it for use with collections that contain
model classes inheriting from `Auth`.

#### `AuthView`

Basic user login form view. Provided as an example form.

#### `authenticate` route middleware

Require `authenticate` connect middleware and add it as route middleware for
POST requests at `authUrl` of authenticating models.

    var express = require('express'),
        server = express.createServer(),
        secret = 'MySecretKey';

    // Middleware for sessions.
    ui_server.use(express.bodyDecoder());
    ui_server.use(express.cookieDecoder());
    ui_server.use(express.session({
        secret: secret,
        store: new express.session.MemoryStore({ reapInterval: -1 })
    }));

    // Pass secret key to Bones.
    require('bones').Bones(server, { secret: secret });

    // Require bones-auth to use authenticate middleware.
    var authenticate = require('bones-auth').authenticate;
    app.post('/api/Authenticate', authenticate(secret));

#### Authors

- [Will White](http://github.com/willwhite)
- [Young Hahn](http://github.com/yhahn)

