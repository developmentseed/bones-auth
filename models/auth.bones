// Auth
// ----
// Model. Base class for models that may authenticate.
model = Backbone.Model.extend({
    // Authentication endpoint URL. Override this in base classes to use a
    // different path for `authenticate` requests.
    authUrl: '/api/authentication',

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
        var url = _.isFunction(this.authUrl) ? this.authUrl() : this.authUrl,
            that = this;
        // Grab CSRF protection cookie and merge into `params`.
        Backbone.csrf && (params['bones.csrf'] = Backbone.csrf(url));
        // Make the request.
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
