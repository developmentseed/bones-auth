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
        return '/api/User/' + this.id;
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
        this.set(data);
        this.authenticated = data.id !== null;
        this.trigger('auth:status', this);
    },

    error: function(xhr) {
        try {
            var data = $.parseJSON(xhr.responseText);
            data = data.error || data;
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
            success: this.success,
            error: this.error
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

    validate: function(attr) {
        // Login.
        if (!_.isUndefined(attr.id) && !_.isUndefined(attr.password)) {
            if (!attr.id)
                return { error: 'Username is required.', field: 'id' };
            if (!attr.password)
                return { error: 'Password is required.', field: 'password' };
        }
        // Change password.
        if (!_.isUndefined(attr.password) && !_.isUndefined(attr.passwordConfirm)) {
            if (!attr.password)
                return { error: 'Password is required.', field: 'password' };
            if (!attr.passwordConfirm)
                return { error: 'Password confirmation is required.', field: 'passwordConfirm' };
            if (attr.password !== attr.passwordConfirm)
                return { error: 'Passwords do not match.', field: 'password' };
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
