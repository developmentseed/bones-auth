var writeHead = require('http').ServerResponse.prototype.writeHead;

// Authentication middleware
// -------------------------
// Factory function that returns an Express session-based authentication
// middleware. Automatically adds the Connect session middleware.
//
// - `args.model`: Optional. Model class to use for authentication. Supply
//   your own custom Auth model, or default to `Auth`.
// - `args.store`: Optional. An instance of the session store to use.
//   Defaults to Connect `session.MemoryStore`.
// - `args.url`': Optional. The url at which authentication requests should
//   be accepted. Defaults to `/api/Auth`.
// - `args.adminParty`': Boolean or Object. When true a default `admin`
//   user is always logged in. Optionally pash a hash of attributes to use for
//   the default logged in user.  For *development convenience only* -- should
//   never be used in production.
router = Bones.Router.extend({
    initialize: function(app, args) {
        if (!args) args = {};
        args.model = args.model || models['User'];
        args.store = args.store || new middleware.session.MemoryStore({ reapInterval: -1 }),
        args.url = args.url || '/api/Auth';
        args.key = args.key || 'connect.sid';

        this.args = args;
        this.config = app.plugin.config;
        this.session = middleware.session({ secret: args.model.secret() });

        this.server.use(this.selectiveSession.bind(this));
        this.server.use(this.user.bind(this));
        this.server.use(this.hashPassword.bind(this));
        this.config.adminParty && this.server.use(this.admin.bind(this));
        this.server.use(this.getStatus.bind(this));
        this.server.use(this.login.bind(this));
        this.server.use(this.logout.bind(this));
    },

    // Simple path/method matcher.
    matchRoute: function(path, method, req) {
        method = method.toLowerCase();
        return req.url === path &&
            method.indexOf(req.method.toLowerCase()) !== -1;
    },

    // Use session middleware if req has session cookie,
    // path matches auth URL or we're having an admin party.
    selectiveSession: function(req, res, next) {
        if (
            req.cookies[this.args.key] ||
            this.config.adminParty ||
            this.matchRoute(this.args.url, 'post delete', req)
        ) {
            this.session(req, res, next);
        } else {
            next();
        }
    },

    // Instantiate user model from stored user JSON.
    // See https://github.com/senchalabs/connect/blob/master/lib/middleware/session/memory.js#L70-76
    // for how user models are converted to JSON when sessions are saved.
    user: function(req, res, next) {
        if (req.session && req.session.user) {
            req.session.user = new this.args.model(req.session.user, req.query);
            req.session.user.authenticated = true;
        }
        next();
    },

    // NOTE: Add the auth router before the core router.
    // Hash all passwords before anyone else sees them. This is the
    // only place the hash function is known.
    hashPassword: function(req, res, next) {
        if (req.body) {
            if (req.body.password) {
                req.body.password = this.args.model.hash(req.body.password);
            }
            if (req.body.passwordConfirm) {
                req.body.passwordConfirm = this.args.model.hash(req.body.passwordConfirm);
            }
        }
        next();
    },

    admin: function(req, res, next) {
        // Always log in when we're having an admin party.
        new this.args.model({ id: 'admin' }, req.query).fetch({
            success: function(model, resp) {
                req.session.regenerate(function() {
                    req.session.user = model;
                    req.session.user.authenticated = true;
                    this.status(req, res, next);
                });
            }.bind(this),
            error: function() {
                res.send({ error: 'User model failed to auto-login.' }, 500);
            }.bind(this)
        });
    },

    status: function(req, res, next) {
        var key = this.args.key;
        if (req.session.user) {
            // Keep the session fresh.
            req.session.touch();
            res.send({ id: req.session.user.id });
        } else {
            // There's no user object, so we'll just destroy the session.
            res.cookie(key, '', _.defaults({ maxAge: - 864e9 }, req.session.cookie));
            req.session.destroy();
            res.send({ id: null });
        }
    },

    getStatus: function(req, res, next) {
        if (!this.matchRoute(this.args.url, 'get', req)) return next();

        // Back out early when the user doesn't have any cookies set.
        if (!req.session && (!req.cookies || !req.cookies[this.args.key])) {
            res.send({ id: null });
            return;
        }
        this.status(req, res, next);
    },

    login: function(req, res, next) {
        if (!this.matchRoute(this.args.url, 'post', req)) return next();

        // Back out early when data is missing.
        if (!req.body.id || !req.body.password) {
            return res.send({ error: 'Access denied' }, 403);
        }

        var status = this.status.bind(this);
        new this.args.model({ id: req.body.id }, req.query).fetch({
            success: function(model, resp) {
                if (resp.password === req.body.password) {
                    req.session.regenerate(function() {
                        req.session.user = model;
                        req.session.user.authenticated = true;
                        status(req, res, next);
                    });
                } else {
                    res.send({ error: 'Access denied' }, 403);
                }
            }.bind(this),
            error: function() {
                res.send({ error: 'Access denied' }, 403);
            }.bind(this)
        });
    },

    logout: function(req, res, next) {
        if (!this.matchRoute(this.args.url, 'delete', req)) return next();

        delete req.session.user;
        this.status(req, res, next);
        // Note: the cookie will be deleted by .status()
    }
});
