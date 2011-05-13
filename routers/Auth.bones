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
        var router = this;

        if (!args) args = {};
        args.model = args.model || models['User'];
        args.store = args.store || new middleware.session.MemoryStore({ reapInterval: -1 }),
        args.url = args.url || '/api/Auth';
        args.key = args.key || 'connect.sid';

        this.args = args;
        this.config = app.plugin.config;

        this.session = middleware.session({ secret: args.model.secret() });
        this.admin = this.admin.bind(this);
        this.status = this.status.bind(this);
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);

        // Use session middleware if req has session cookie.
        this.server.use(function(req, res, next) {
            if (req.cookies[args.key]) {
                router.session(req, res, next);
            } else {
                next();
            }
        });

        // Instantiate user model from stored user JSON.
        // See https://github.com/senchalabs/connect/blob/master/lib/middleware/session/memory.js#L70-76
        // for how user models are converted to JSON when sessions are saved.
        this.server.use(function(req, res, next) {
            if (req.session && req.session.user) {
                req.session.user = new this.args.model(req.session.user);
                req.session.user.authenticated = true;
            }
            next();
        }.bind(this));

        // NOTE: Add the auth router before the core router.
        var model = new args.model({ id: '' });
        var route = _.isFunction(model.url) ? model.url() : model.url;
        this.server.use(route, function hashPasswords(req, res, next) {
            // Hash all passwords before anyone else sees them. This is the
            // only place the hash function is known.
            if (req.body) {
                if (req.body.password) req.body.password = args.model.hash(req.body.password);
                if (req.body.passwordConfirm) req.body.passwordConfirm = args.model.hash(req.body.passwordConfirm);
            }
            next();
        });

        // Moving the .get()/.post()/... calls below the .use() call as
        // they obscure the .use()
        // TODO: Find a solution so that other modules also can do .use()
        if (this.config.adminParty) {
            // Always log in when we're having an admin party.
            this.server.get(args.url, this.session, this.admin, this.status);
        } else {
            this.server.get(args.url, this.status);
        }
        this.server.post(args.url, this.session, this.login, this.status);
        this.server.del(args.url, this.session, this.logout, this.status);
    },

    admin: function(req, res, next) {
        // Always log in when we're having an admin party.
        new this.args.model({ id: 'admin' }).fetch({
            success: function(model, resp) {
                req.session.regenerate(function() {
                    req.session.user = model;
                    req.session.user.authenticated = true;
                    next();
                });
            },
            error: function() {
                res.send({ error: 'User model failed to auto-login.' }, 500);
            }
        });
    },

    status: function(req, res, next) {
        // Back out early when the user doesn't have any cookies set.
        if (!req.session && (!req.cookies || !req.cookies[this.args.key])) {
            res.send({ id: null });
            return;
        }

        var key = this.args.key;
        this.session(req, res, function() {
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
        });
    },

    login: function(req, res, next) {
        // Back out early when data is missing.
        if (!req.body.id || !req.body.password) {
            res.send({ error: 'Access denied' }, 403);
            return;
        }

        var router = this;
        new this.args.model({ id: req.body.id }).fetch({
            success: function(model, resp) {
                if (resp.password === model.constructor.hash(req.body.password)) {
                    req.session.regenerate(function() {
                        req.session.user = model;
                        req.session.user.authenticated = true;
                        next();
                    });
                } else {
                    res.send({ error: 'Access denied' }, 403);
                }
            },
            error: function() {
                res.send({ error: 'Access denied' }, 403);
            }
        });
    },

    logout: function(req, res, next) {
        delete req.session.user;
        next();
        // Note: the cookie will be deleted by .status()
    }
}, {
    requireValidUser: function(app, methods, route) {
        if (!Array.isArray(methods)) {
            route = methods;
            methods = ['all'];
        }
        methods.forEach(function(method) { app.server[method](route, check); });

        function check(req, res, next) {
            app.routers.Auth.session(req, res, function() {
                if (!req.session.user) res.send(403);
                else next();
            });
        };
    }
});
