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
        return '/api/user/' + this.id;
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
    model = models.Auth.extend(models.Document.extend(User).prototype);
} else {
    model = models.Auth.extend(User);
}
