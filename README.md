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

#### `authenticate` middleware

Require `authenticate` connect middleware and add it as a middleware for
authenticating models. Automatically adds and manages the Connect session
middleware -- session cookies will only be sent and active when authenticating
and/or an authenticated session already exists. Allows for sane proxy caching.

    var express = require('express'),
        server = express.createServer(),
        secret = 'MySecretKey';

    // Express middleware.
    server.use(express.bodyDecoder());
    server.use(express.cookieDecoder());

    // Pass secret key to Bones for CSRF protection.
    require('bones').Bones(server, { secret: secret });

    // Require bones-auth to use authenticate middleware.
    // Handles authentication requests to `/api/Authenticate`.
    var authenticate = require('bones-auth').authenticate;
    server.use(authenticate({ secret: secret });

#### Authors

- [Will White](http://github.com/willwhite)
- [Young Hahn](http://github.com/yhahn)

