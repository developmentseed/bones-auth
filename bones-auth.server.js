var _ = require('underscore')._,
    fs = require('fs'),
    path = require('path'),
    crypto = require('crypto'),
    session = require('connect').middleware.session,
    Bones = require('bones'),
    Auth = require('./bones-auth').models.Auth,
    AuthList = require('./bones-auth').models.AuthList,
    templates = [
        'AdminFormLogin',
        'AdminFormUser',
        'AdminTableRowUser'
    ];

// Load templates. Blocking at require time.
templates.forEach(function(template) {
    Bones.templates[template] = Bones.templates[template] ||
        fs.readFileSync(path.join(__dirname, 'templates', template + '.hbs'), 'utf-8');
});

// Pass through require of bones-auth. Overrides for server-side context below.
module.exports = require('./bones-auth');

// Apply overrides for server-side context. Requires `hash` function for
// hashing passwords before storage.
var applyOverrides = function(hash) {
    // Override parse for Auth model. Filters out passwords server side
    // such that they are never returned to the client. The `password`
    // property is preserved on the original response object enabling
    // authentication code to access the response directly.
    Auth.prototype.parse = function(resp) {
        var filtered = _.clone(resp);
        !_.isUndefined(filtered.password) && (delete filtered.password);
        return filtered;
    };
    // Override sync for Auth model. Hashes passwords when saved to
    // persistence.
    Auth.prototype.sync = function(method, model, success, error) {
        switch (method) {
        case 'create':
        case 'update':
            var authWriteSuccess = function(resp) {
                model.unset('password');
                success(resp);
            };
            var authWriteError = function(resp) {
                model.unset('password');
                error(resp);
            };
            var authWrite = function(data) {
                data.password && model.set(
                    {password: data.password},
                    {silent: true}
                );
                Backbone.sync(method, model, authWriteSuccess, authWriteError);
            };
            if (model.get('passwordConfirm')) model.unset('passwordConfirm');
            if (model.get('password')) {
                authWrite({ password: hash(model.get('password')) });
            } else {
                Backbone.sync('read', model, authWrite, authWrite);
            }
            break;
        default:
            Backbone.sync(method, model, success, error);
            break;
        }
    };
    // Override parse for AuthList collection. Calls `parse` from above on
    // each model, stripping private attributes.
    AuthList.prototype.parse = function(resp) {
        return _.map(resp, this.model.prototype.parse);
    };
};

// Authentication middleware
// -------------------------
// Factory function that returns an Express session-based authentication
// middleware. Automatically adds the Connect session middleware.
//
// - `options.secret`: A stable, secret key that is only accessible to the
//   server. The secret key is used to hash Auth model passwords when saving to
//   persistence and to authenticate incoming authentication requests against
//   saved values.
// - `options.Model`: Optional. Model class to use for authentication. Supply
//   your own custom Auth model, or default to `Auth`.
// - `options.store`: Optional. An instance of the session store to use.
//   Defaults to Connect `session.MemoryStore`.
// - `options.url`': Optional. The url at which authentication requests should
//   be accepted. Defaults to `/api/Authenticate`.
// - `options.adminParty`': Boolean or Object. When true a default `admin`
//   user is always logged in. Optionally pash a hash of attributes to use for
//   the default logged in user.  For *development convenience only* -- should
//   never be used in production.
module.exports.authenticate = function(options) {
    options = options || {};
    options.secret = options.secret || '';
    options.Model = options.Model || Auth;
    options.store = options.store || new session.MemoryStore({ reapInterval: -1 }),
    options.url = options.url || '/api/Authenticate';
    options.key = options.key || 'connect.sid';

    // Generate hash function that uses secret key and apply Auth server-side
    // overrides.
    var hash = function(string) {
        return crypto
            .createHmac('sha256', options.secret)
            .update(string)
            .digest('hex');
    };
    applyOverrides(hash);

    // Helper for destroying a session. Destroys the session object and also
    // sends an expired session cookie to the client.
    var destroySession = function(req, res, options) {
        req.session.destroy();
        res.writeHead = function(status, headers) {
            res.cookie(options.key, '', _.extend(
                _.clone(options.store.cookie),
                { expires: new Date(1) }
            ));
            return writeHead.call(this, status, this.headers);
        };
    }

    var sess = session(options),
        writeHead = require('http').ServerResponse.prototype.writeHead;

    // Main authentication middleware. Handles load/logout/login operations.
    var authenticate = function(req, res, next) {
        // If `adminParty` enabled, treat all as logged in `admin` user.
        if (options.adminParty && req.session) {
            req.session.user = new options.Model(
                _(options.adminParty).isBoolean()
                ? {id:'admin'}
                : options.adminParty
            );
            req.session.user.authenticated = true;
        }
        // Auth operation.
        if (req.url === options.url && req.body) {
            switch (req.body.method) {
            case 'load':
                if (req.session.user) {
                    res.send(req.session.user.toJSON());
                } else {
                    res.send('Access denied.', 403);
                }
                break;
            case 'logout':
                if (req.session && req.session.user) {
                    delete req.session.user;
                    destroySession(req, res, options);
                    res.send({}, 200);
                } else {
                    res.send('Access denied.', 403);
                }
                break;
            case 'login':
                var model = new options.Model({id: req.body.id});
                model.fetch({
                    success: function(model, resp) {
                        if (resp.password === hash(req.body.password)) {
                            req.session.regenerate(function() {
                                req.session.user = model;
                                req.session.user.authenticated = true;
                                res.send(model.toJSON(), 200);
                            });
                        } else {
                            res.send('Access denied.', 403);
                        }
                    },
                    error: function() {
                        res.send('Access denied.', 403);
                    }
                });
                break;
            default:
                res.send('Access denied.', 403);
                break;
            }
        // All other requests -- if there is no user and a session  exists,
        // destroy it.
        } else {
            !req.session.user &&
                req.cookies[options.key] &&
                destroySession(req, res, options);
            next();
        }
    };

    // Wrapping middleware - adds session handling selectively: only when a
    // session is active or at the authentication URL endpoint.
    return function(req, res, next) {
        if (options.url === req.url || req.cookies[options.key] || options.adminParty) {
            sess(req, res, function() { authenticate(req, res, next) });
        } else {
            next();
        }
    };
};

