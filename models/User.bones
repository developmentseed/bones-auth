// User
// ----
// Basic user model. If Document model is present, uses JSON schema and
// JSV validation.
var User = {
    schema: {
        'type': 'object',
        'id': 'User',
        'properties': {
            'id': {
                'type': 'string',
                'title': 'Username',
                'pattern': '^[A-Za-z0-9\-_ ]+$',
                'required': true,
                'minLength': 1
            },
            'password': {
                'type': 'string',
                'title': 'Password'
            },
            'email': {
                'type': 'string',
                'title': 'Email address',
                'format': 'email'
            }
        }
    },
    url: function() {
        return '/api/User/' + encodeURIComponent(this.id);
    },
    authUrl: '/api/Auth',

    // Boolean. Marks whether a User model has been authenticated. Do not
    // trust this flag for critical client-side access protection as it can be
    // modified by other javascript code.
    authenticated: false,

    initialize: function() {
        _.bindAll(this, 'success', 'error');
    },

    success: function(data) {
        if (data.id !== null) {
            this.set(data);
            this.authenticated = true;
        } else {
            this.clear();
            this.authenticated = false;
        }
        this.trigger('auth:status', this);
    },

    error: function(xhr) {
        try {
            var data = $.parseJSON(xhr.responseText);
            data = data.message || data;
        } catch(e) {
            var data = xhr.responseText;
        }
        this.trigger('auth:error', this, { error: data });
    },

    request: function(method, params) {
        if (!params) params = {};

        // Validate params.
        var error;
        if (method === 'POST' && this.validate && (error = this.validate(params))) {
            this.trigger('auth:error', this, error);
            return false;
        }

        var url = _.isFunction(this.authUrl) ? this.authUrl() : this.authUrl;
        url = params.url || url;

        url += (/\?/.test(url) ? '&' : '?') + '_=' + $.now();

        // Grab CSRF protection cookie and merge into `params`.
        if (method !== 'GET') params['bones.token'] = Backbone.csrf(url);

        // Make the request.
        $.ajax({
            url: url,
            type: method,
            contentType: 'application/json',
            processData: method === 'GET',
            data: method === 'GET' ? params : JSON.stringify(params),
            dataType: 'json',
            success: params.success || this.success,
            error: params.error || this.error
        });

        return this;
    },

    status: function(params) {
        return this.request('GET', params);
    },

    login: function(params) {
        return this.request('POST', params);
    },

    logout: function(params) {
        return this.request('DELETE', params);
    },

    resetPassword: function(params) {
        _.defaults(params, { url : '/api/reset-password/' + params.id });

        return this.request('POST', params);
    },
    tokenLogin: function(params) {
        if (params.token) {
            params.url = '/api/reset-password/' + params.token;
            delete params.token;
        }

        return this.request('GET', params);
    },
    validate: function(attr) {
        // Login.
        if (!_.isUndefined(attr.id) && !_.isUndefined(attr.password)) {
            if (!attr.id)
                return new Error('Username is required.');
            if (!attr.password)
                return new Error('Password is required.');
        }
        // Change email/password.
        if (!_.isUndefined(attr.password) && !_.isUndefined(attr.passwordConfirm)) {
            if (!attr.email)
                return new Error('Email is required.');
            if (!attr.password)
                return new Error('Password is required.');
            if (!attr.passwordConfirm)
                return new Error('Password confirmation is required.');
            if (attr.password !== attr.passwordConfirm)
                return new Error('Passwords do not match.');
        }
        // Perform JSON schema validation if method exists.
        if (this.validateSchema) {
            return this.validateSchema(attr);
        }
    }
};

if (models.Document) {
    model = models.Document.extend(User);
} else {
    model = Backbone.Model.extend(User);
}
