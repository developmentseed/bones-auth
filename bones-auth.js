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
    authenticate: function(params, options) {
        // Grab CSRF protection cookie and merge into `params`.
        if (Backbone.csrf) {
            var csrf = Backbone.csrf();
            (csrf) && (params['bones.csrf'] = csrf);
        }
        // Make the request.
        var url = _.isFunction(this.authUrl) ? this.authUrl() : this.authUrl;
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(params),
            dataType: 'json',
            processData: false,
            success: options.success,
            error: options.error
        });
    }
});

// AuthView
// --------
// View. Basic login form.
var AuthView = Backbone.View.extend({
    id: 'AuthView',
    tagName: 'form',
    initialize: function() {
        _.bindAll(this, 'authenticate');
        this.render();
    },
    render: function() {
        $(this.el).html(this.template('AuthView'));
        return this;
    },
    events: {
        'click input[type=button]': 'authenticate'
    },
    authenticate: function() {
        this.model.authenticate(
            {
                id: this.$('input[name=username]').val(),
                password: this.$('input[name=password]').val()
            },
            {
                success: function() {},
                error: function() {}
            }
        );
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
        // Override sync for Auth model. Allows password to never be read
        // directly and `sha512` hashed when saved to persistence.
        Auth.prototype.sync = function(method, model, success, error) {
            switch (method) {
            case 'read':
                var authRead = function(data) {
                    _.isUndefined(data.password) && (delete data.password);
                    success(data);
                };
                Backbone.sync(method, model, authRead, error);
                break;
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
            var model = new Model({id: req.body.id});
            model.fetch({
                success: function() {
                    if (model.get('password') === hash(req.body.password)) {
                        req.session.regenerate(function() {
                            req.session.user = model;
                            res.send({}, 200);
                        });
                    } else {
                        res.send('Access denied.', 403);
                    }
                },
                error: function() {
                    res.send('Access denied.', 403);
                }
            });
        };
    }
});
