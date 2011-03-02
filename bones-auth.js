// Server/client-side wrapper.
if (typeof module !== 'undefined') {
    _ = require('underscore')._,
    Backbone = require('backbone'),
    Bones = require('bones'),
    fs = require('fs');

    // Load AuthView template into Bones templates.
    Bones.templates['AuthView'] = Bones.templates['AuthView'] ||
        fs.readFileSync(__dirname + '/AuthView.hbs', 'utf-8');
}

// Auth
// ----
// Model. Base class for models that may authenticate.
var Auth = Backbone.Model.extend({
    authUrl: '/api/Authenticate',
    authenticated: false,
    authenticate: function(method, params, options) {
        if (_(['load', 'login', 'logout']).indexOf(method) === -1) {
            throw new Error('Auth method must be specified.');
        }
        // Default options object.
        options = options || {};
        options.success = options.success || function() {};
        options.error = options.error || function() {};
        // Default params object.
        params = params || {};
        params.method = params.method || method;
        // Grab CSRF protection cookie and merge into `params`.
        if (Backbone.csrf) {
            var csrf = Backbone.csrf();
            (csrf) && (params['bones.csrf'] = csrf);
        }
        // Make the request.
        var url = _.isFunction(this.authUrl) ? this.authUrl() : this.authUrl,
            that = this;
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(params),
            dataType: 'json',
            processData: false,
            success: function(data) {
                !_.isEmpty(data) && that.set(data);
                that.authenticated = (method === 'load' || method === 'login');
                that.trigger('auth', that);
                that.trigger('auth:' + method, that);
                options.success(data);
            },
            error: options.error
        });
    }
});

// AuthView
// --------
// View. Example login form.
var AuthView = Backbone.View.extend({
    id: 'AuthView',
    tagName: 'form',
    initialize: function() {
        _.bindAll(this, 'render', 'auth');
        this.model.bind('auth', this.render);
        this.render();
    },
    render: function() {
        $(this.el).html(this.template('AuthView', this.model));
        return this;
    },
    events: {
        'click input[type=button]': 'auth'
    },
    auth: function() {
        if (this.model.authenticated) {
            this.model.authenticate('logout', {});
        } else {
            this.model.authenticate('login', {
                id: this.$('input[name=username]').val(),
                password: this.$('input[name=password]').val()
            });
        }
        this.$('input[name=username]').val('');
        this.$('input[name=password]').val('');
        return false;
    }
});

// Server-side.
(typeof module !== 'undefined') && (module.exports = {
    Auth: Auth,
    AuthView: AuthView,
    // Authentication middleware
    // -------------------------
    // Factory function that returns a route middleware that should be used at an
    // Auth model `authUrl` endpoint.
    authenticate: function(privateKey, Model) {
        var crypto = require('crypto');
        var hash = function(string) {
            return crypto.createHmac('sha256', privateKey)
                .update(string)
                .digest('hex');
        };
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
        Model = Model || Auth;
        return function(req, res, next) {
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
                    res.send({}, 200);
                } else {
                    res.send('Access denied.', 403);
                }
                break;
            case 'login':
                var model = new Model({id: req.body.id});
                model.fetch({
                    success: function(model, resp) {
                        if (resp.password === hash(req.body.password)) {
                            req.session.regenerate(function() {
                                req.session.user = model;
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
        };
    }
});
