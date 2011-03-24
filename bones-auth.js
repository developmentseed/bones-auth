if (typeof process !== 'undefined') {
    _ = require('underscore')._,
    Backbone = require('backbone'),
    Bones = require('bones');

    // Optional mixins.
    try {
        require('bones-admin');
        require('bones-document');
    } catch(e) {}
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

// AuthList
// --------
// Base class for Auth-based collections. See server-side overrides below.
Bones.models.AuthList = Backbone.Collection.extend({
    model: Bones.models.Auth
});

// User
// ----
// Basic user model. If Document model is present, uses JSON schema and
// JSV validation.
var User = {
    schema: {
        'id': {
            'type': 'string',
            'title': 'Username',
            'pattern': '^[A-Za-z0-9\-_ ]+$',
            'required': true
        },
        'password': {
            'type': 'string',
            'title': 'Password'
        }
    },
    url: function() {
        return '/api/User/' + this.id;
    },
    validate: function(attr) {
        // Login.
        if (!_.isUndefined(attr.id) && !_.isUndefined(attr.password)) {
            if (!attr.id)
                return 'Username is required.';
            if (!attr.password)
                return 'Password is required.';
        }
        // Change password.
        if (!_.isUndefined(attr.password) && !_.isUndefined(attr.passwordConfirm)) {
            if (!attr.password)
                return 'Password is required.';
            if (!attr.passwordConfirm)
                return 'Password confirmation is required.';
            if (attr.password !== attr.passwordConfirm)
                return 'Passwords do not match.';
        }
        // Perform JSON schema validation if method exists.
        if (this.validateSchema) {
            return this.validateSchema(attr);
        }
    }
};
if (Bones.models.Document) {
    Bones.models.User = Bones.models.Auth.extend(Bones.models.Document.extend(User).prototype);
} else {
    Bones.models.User = Bones.models.Auth.extend(User);
}

// Users
// -----
// Collection of all users.
Bones.models.Users = Bones.models.AuthList.extend({
    model: Bones.models.User,
    url: '/api/User',
    comparator: function(model) {
        return model.id.toLowerCase();
    }
});

// AdminDropdownUser
// -----------------
// User management dropdown.
Bones.views.AdminDropdown && (Bones.views.AdminDropdownUser = Bones.views.AdminDropdown.extend({
    icon: 'user',
    events: _.extend({
        'click a[href=#logout]': 'logout',
        'click a[href=#user]': 'user',
        'click a[href=#userCreate]': 'userCreate',
        'click a[href=#userView]': 'userView'
    }, Bones.views.AdminDropdown.prototype.events),
    links: [
        { href: '#user', title: 'My account' },
        { href: '#userCreate', title: 'Create user' },
        { href: '#userView', title: 'View users' },
        { href: '#logout', title: 'Logout' },
    ],
    initialize: function(options) {
        this.title = this.model.id;
        _.bindAll(this, 'logout', 'user', 'userCreate', 'userView');
        Bones.views.AdminDropdown.prototype.initialize.call(this, options);
    },
    logout: function() {
        this.model.authenticate('logout', {}, { error: this.admin.error });
        return false;
    },
    user: function() {
        new Bones.views.AdminPopupUser({
            title: 'My account',
            model: this.model,
            admin: this.admin
        });
        return false;
    },
    userCreate: function() {
        new Bones.views.AdminPopupUser({
            title: 'Create user',
            model: new this.model.constructor(),
            admin: this.admin
        });
        return false;
    },
    userView: function() {
        new Bones.views.AdminTable({
            title: 'Users',
            collection: new Bones.models.Users(),
            admin: this.admin,
            header: [
                {title:'Username'},
                {title:'Actions', className:'actions'}
            ],
            rowView: Bones.views.AdminTableRowUser
        });
        return false;
    }
}));

// AdminPopupUser
// --------------
// User account creation/update popup.
Bones.views.AdminPopup && (Bones.views.AdminPopupUser = Bones.views.AdminPopup.extend({
    events: _.extend({
        'click input[type=submit]': 'submit'
    }, Bones.views.AdminPopup.prototype.events),
    initialize: function (options) {
        _.bindAll(this, 'submit');
        this.create = !Boolean(this.model.id);
        this.content = this.template('AdminFormUser', this.model);
        Bones.views.AdminPopup.prototype.initialize.call(this, options);
    },
    submit: function() {
        var that = this;
        var params = {
            id: this.model.id || this.$('input[name=id]').val(),
            password: this.$('input[name=password]').val(),
            passwordConfirm: this.$('input[name=passwordConfirm]').val()
        };
        this.model.save(params, {
            success: function() {
                var message = that.create
                    ? 'User ' + that.model.id + ' created.'
                    : 'Password changed.';
                new Bones.views.AdminGrowl({message: message});
                that.close();
            },
            error: this.admin.error
        });
        return false;
    }
}));

// AdminTableRowUser
// -----------------
// Custom table row for users.
Bones.views.AdminTableRow && (Bones.views.AdminTableRowUser = Bones.views.AdminTableRow.extend({
    initialize: function(options) {
        _.bindAll(this, 'render');
        Bones.views.AdminTableRow.prototype.initialize.call(this, options);
    },
    render: function () {
        $(this.el).html(this.template('AdminTableRowUser', this.model));
        return this;
    }
}));

// AdminLogin
// ----------
// View. Login form that integrates with `bones-admin` toolbar as an auth view.
Bones.views.AdminLogin = Backbone.View.extend({
    admin: null,
    context: null,
    events: {
        'click input[type=submit]': 'auth'
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'attach', 'auth');
        options = options || {};
        this.admin = options.admin || null;
        this.context = options.context || $('#bonesAdminToolbar > .auth');
        this.render().trigger('attach');
    },
    render: function() {
        $(this.el).html(this.template('AdminFormLogin', this.model));
        return this;
    },
    attach: function () {
        this.context.prepend(this.el);
        return this;
    },
    auth: function() {
        this.model.authenticate('login', {
            id: this.$('input[name=username]').val(),
            password: this.$('input[name=password]').val()
        }, { error: this.error });
        this.$('input[name=username], input[name=password]').val('');
        return false;
    }
});


(typeof module !== 'undefined') && (module.exports = {
    models: {
        Auth: Bones.models.Auth,
        AuthList: Bones.models.AuthList,
        User: Bones.models.User,
        Users: Bones.models.Users
    },
    views: {
        AdminDropdownUser: Bones.views.AdminDropdownUser,
        AdminPopupUser: Bones.views.AdminPopupUser,
        AdminTableRowUser: Bones.views.AdminTableRowUser,
        AdminLogin: Bones.views.AdminLogin
    }
});

