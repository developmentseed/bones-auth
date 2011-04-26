var crypto = require('crypto');
var writeHead = require('http').ServerResponse.prototype.writeHead;

// Authentication middleware
// -------------------------
// Factory function that returns an Express session-based authentication
// middleware. Automatically adds the Connect session middleware.
//
// - `args.secret`: A stable, secret key that is only accessible to the
//   server. The secret key is used to hash Auth model passwords when saving to
//   persistence and to authenticate incoming authentication requests against
//   saved values.
// - `args.model`: Optional. Model class to use for authentication. Supply
//   your own custom Auth model, or default to `Auth`.
// - `args.store`: Optional. An instance of the session store to use.
//   Defaults to Connect `session.MemoryStore`.
// - `args.url`': Optional. The url at which authentication requests should
//   be accepted. Defaults to `/api/Authenticate`.
// - `args.adminParty`': Boolean or Object. When true a default `admin`
//   user is always logged in. Optionally pash a hash of attributes to use for
//   the default logged in user.  For *development convenience only* -- should
//   never be used in production.
router = Bones.Router.extend({
    initialize: function(server, args) {
        if (!args) args = {};
        args.secret = args.secret || '';
        args.model = args.model || models['Auth'];
        args.store = args.store || new express.session.MemoryStore({ reapInterval: -1 }),
        args.url = args.url || '/api/authentication';
        args.key = args.key || 'connect.sid';

        this.args = args;
        this.config = server.plugin.config;
        this.hash = function(string) {
            return crypto.createHmac('sha256', args.secret).update(string).digest('hex');
        };

        this.session = express.session(args);
        this.status = this.status.bind(this);
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);

        this.server.get(args.url, this.status);
        this.server.post(args.url, this.session, this.login, this.status);
        this.server.del(args.url, this.session, this.logout, this.status);
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
                if (resp.password === router.hash(req.body.password)) {
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
});
