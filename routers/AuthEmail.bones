var email = require('email');

// Email verification middleware
// ----------------------------
router = Bones.Router.extend({
    initialize: function(app, args) {
        var router = this;

        if (!args) args = {};
        args.model = args.model || models['User'];
        args.url = '/api/AuthEmail/:id';

        this.args = args;
        this.config = app.plugin.config;

        this.AuthEmail = this.AuthEmail.bind(this);

        this.server.post(args.url, this.AuthEmail);
    },
    AuthEmail: function(req, res, next) {
        new this.args.model({id: req.params.id}).fetch({
            success: function(model, resp) {
                if (!model.get('email')) {
                    next(new Error.HTTP('Invalid email address', 400));
                }
                else {
                    res.send({message: 'Email has been sent'});
                }
            },
            error: function() {
                next(new Error.HTTP(403));
            }
        });
    }
});
