var email = require('email'),
    crypto = require('crypto');

// Email verification middleware
// ----------------------------
router = Bones.Router.extend({
    initialize: function(app, args) {
        var router = this;
        var url = '/api/AuthEmail/:id';

        if (!args) args = {};
        args.model = args.model || models['User'];

        this.args = args;

        this.authEmail = this.authEmail.bind(this);
        this.tokenLogin = this.tokenLogin.bind(this);
        this.generateEmail = this.generateEmail.bind(this);

        this.server.post(url, this.authEmail);
        this.server.get(url, this.tokenLogin);
    },

    // Generate a string containing the date + hour.
    generateTimecode: function(d) {
        function pad(n){return n<10 ? '0'+n : n}
        return [
            d.getUTCFullYear(),
            pad(d.getUTCMonth()+1),
            pad(d.getUTCDate()),
            pad(d.getUTCHours())
        ].join('');
    },

    // Turn a string into a hex token encrypted with the secret.
    encryptRequest: function(data) {
        var cipher = crypto.createCipher(
            Bones.plugin.config.encryptionAlgorithm || 'aes256',
            Bones.plugin.config.secret || 'sensible default required!'
        );

        return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    },

    // Decrypt a token.
    decryptRequest: function(data) {
        var decipher = crypto.createDecipher(
            Bones.plugin.config.encryptionAlgorithm || 'aes256',
            Bones.plugin.config.secret || 'sensible default required!'
        );

        return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
    },

    // Generate a new session for the user identified by the token.
    tokenLogin: function(req, res, next) {
        var content = this.decryptRequest(req.params.id);
        var matches = /^(.*)-(.*)$/.exec(content);

        if (matches && matches[1] && matches[2]) {
            var tokenTime = parseInt(matches[1]),
                tokenId = matches[2];

            // Only accept tokens generated in the last 24 hours.
            var d = new Date();
            d.setUTCDate(d.getUTCDate() - 1);

            var current = parseInt(this.generateTimecode(new Date())),
                earliest = parseInt(this.generateTimecode(d));

            if (tokenTime >= earliest && tokenTime <= current) {
                res.send('success!');
            } else {
                next(new Error.HTTP('Forbidden', 403));
            }
        } else {
            next(new Error.HTTP('Forbidden', 403));
        }
    },

    // Generate an email object with a login token.
    generateEmail: function(model) {
        var token = this.encryptRequest(
            this.generateTimecode(new Date()) + '-' + model.id
        );

        var bodyTemplate = _.template([
            "You password has been reset.",
            "Please go to http://localhost:3000/api/AuthEmail/<%= token %>."
        ].join("\n"));

        var body = bodyTemplate({ token: token });

        var mail = new email.Email({
            from: Bones.plugin.config.adminEmail || 'test@example.com',
            to: '<' + model.get('email') + '>',
            subject: 'Your password has been reset.',
            body: body
        });

        return mail;
    },

    // Send an email to the user containing a login link with a token.
    authEmail: function(req, res, next) {
        var that = this;

        new this.args.model({id: req.params.id}).fetch({
            success: function(model, resp) {
                if (!model.get('email') || !email.isValidAddress(model.get('email'))) {
                    next(new Error.HTTP('Invalid email address', 400));
                }
                else {
                    that.generateEmail(model).send(function(err) {
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
