if (typeof process !== 'undefined') {
    _ = require('underscore')._,
    Backbone = require('backbone'),
    Bones = require('bones');
}

var Bones = Bones || {};
Bones.models = Bones.models || {};
Bones.views = Bones.views || {};

// Auth
// ----
// Model. Base class for models that may authenticate.
Bones.models.Auth = Backbone.Model.extend({
    // Authentication endpoint URL. Override this in base classes to use a
    // different path for `authenticate` requests.
    authUrl: '/api/Authenticate',

    // Boolean. Marks whether an Auth model has been authenticated. Do not
    // trust this flag for critical client-side access protection as it can be
    // modified by other javascript code.
    authenticated: false,

    // Make an authentication call to an Auth model.
    //
    // - `method`:
    //   - `load`: Load the current session model. On `success` considers the
    //     model authenticated.
    //   - `login`': Login the current model. On `success` considers the model
    //     authenticated.
    //   - `logout`': Logout the current model. On `success` considers the
    //     model no longer authenticated.
    // - `params`: Only required for `login` method. Pass login credentials as
    //   `params.id`, `params.password`. Note that `params.password` should not
    //   be `set()` on a model when using `authenticate`, only to change the
    //   password value of a model.
    // - `options`: Takes `options.success` and `options.error` callbacks,
    //   similar to the native Backbone `model.fetch`.
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
        // Validate params.
        var error = this.validate && this.validate(params);
        if (error) {
            options.error(this, error);
            return false;
        }
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
            error: function(data) {
                options.error(that, data);
            }
        });
    }
});

// AuthList
// --------
// Base class for Auth-based collections. See server-side overrides below.
Bones.models.AuthList = Backbone.Collection.extend({
    model: Bones.models.Auth
});

// AuthView
// --------
// View. Example login form.
Bones.views.AuthView = Backbone.View.extend({
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

(typeof module !== 'undefined') && (module.exports = {
    models: {
        Auth: Bones.models.Auth,
        AuthList: Bones.models.AuthList
    },
    views: {
        AuthView: Bones.views.AuthView
    }
});

