Bones Auth
----------
Provides base `Auth` and `AuthList` (model, collection) base
classes and `authenticate` Connect middleware for implementing basic
session-based user login with Backbone.js, Bones and Express.

A basic `User` model that extends `Auth` is provided as an example and
starting point. Integration with `bones-admin` through administrative views
is also available.

### Tested with

- developmentseed bones 0.0.2
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
be "authenticated". See the `User` model for an example.

#### `AuthList`

Abstract collection class. Extend it for use with collections that contain
model classes inheriting from `Auth`.

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

