// Auth
// ----
// Model. Base class for models that may authenticate.
model = Backbone.Model.extend({
    // Authentication endpoint URL. Override this in base classes to use a
    // different path for `authenticate` requests.
    url: '/api/Auth',
    authUrl: '/api/Auth',

    // Boolean. Marks whether an Auth model has been authenticated. Do not
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
        // TODO: this doesn't work
        if (Bones.csrf && params) params['bones.csrf'] = Bones.csrf(url);

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
    }
});
