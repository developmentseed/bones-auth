var email = require('email');

// Email verification middleware
// ----------------------------
router = Bones.Router.extend({
    initialize: function(app, args) {
        var router = this;
        var url = '/api/AuthEmail/:id';

        if (!args) args = {};
        args.model = args.model || models['User'];

        this.args = args;

        this.AuthEmail = this.AuthEmail.bind(this);

        this.server.post(url, this.AuthEmail);
    },
    AuthEmail: function(req, res, next) {
        //if (req.method.toLowerCase() !== 'post') return next();
        
        new this.args.model({id: req.params.id}).fetch({
            success: function(model, resp) {
                if (!model.get('email') || !email.isValidAddress('<' + model.get('email') + '>')) {
                    next(new Error.HTTP('Invalid email address', 400));
                }
                else {
                    var mail = new email.Email({
                        from: Bones.plugin.config.adminEmail || 'test@example.com',
                        to: '<' + model.get('email') + '>',
                        subject: 'Your password has been reset.',
                        body: 'hello world',
                    });
                    mail.send(function(err) {
                        if (err) {
                            res.send('Could not send email.<br /> Contact your administrator', 500);
                        }
                        else {
                            res.send({message: 'Email has been sent'});
                        }
                    });
                }
            },
            error: function() {
                next(new Error.HTTP(403));
            }
        });
    }
});
