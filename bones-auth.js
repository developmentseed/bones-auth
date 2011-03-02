// Server/client-side wrapper.
if (typeof module !== 'undefined') {
    _ = require('underscore')._,
    Backbone = require('backbone');
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
var AuthList = Backbone.Collection.extend({
    model: Auth
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

(typeof module !== 'undefined') && (module.exports = {
    Auth: Auth,
    AuthList: AuthList,
    AuthView: AuthView
});

