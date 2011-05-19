var email = require('email'),
    crypto = require('crypto'),
    fs = require('fs'),
    Buffer = require('buffer').Buffer;

// Email verification middleware
// ----------------------------
servers.Auth.augment({
    initialize: function(parent, app, args) {
        parent.call(this, app, args);

        var url = '/api/reset-password/:id';

        if (!args) args = {};
        args.model = args.model || models['User'];
        args.key = args.key || 'connect.sid';

        this.args = args;

        this.authEmail = this.authEmail.bind(this);
        this.tokenLogin = this.tokenLogin.bind(this);
        this.generateEmail = this.generateEmail.bind(this);

        // TODO replace with a middleware.
        this.post(url, this.authEmail);
        this.get(url, this.session, this.tokenLogin);
    }
});

// Turn a string into a hex token encrypted with the secret.
servers.Auth.prototype.encryptExpiringRequest = function(data, secret) {
    data = new Buffer(JSON.stringify(data), 'utf8').toString('binary');
    var cipher = crypto.createCipher('aes-256-cfb', secret);
    var timestamp = (Date.now() / 1000).toFixed();
    while (timestamp.length < 10) timestamp = '0' + timestamp;
    var hash = crypto.createHash('sha256').update(secret).update(timestamp).update(data).digest('binary');
    var request = cipher.update(hash, 'binary', 'binary') +
                  cipher.update(timestamp, 'binary', 'binary') +
                  cipher.update(data, 'binary', 'binary') +
                  cipher['final']('binary');
    return new Buffer(request, 'binary').toString('base64');
};

// Decrypt a token.
servers.Auth.prototype.decryptExpiringRequest = function(data, secret, maxAge) {
    if (typeof maxAge === 'undefined') maxAge = 86400;
    var decipher = crypto.createDecipher('aes-256-cfb', secret);
    var request = decipher.update(data, 'base64', 'binary') + decipher['final']('binary');
    var hash = crypto.createHash('sha256').update(secret).update(request.substring(32)).digest('binary');
    if (hash !== request.substring(0, hash.length)) return undefined;
    var timestamp = parseInt(request.substring(hash.length, hash.length + 10), 10);
    if ((Date.now() / 1000).toFixed() > (timestamp + maxAge)) return undefined;
    return JSON.parse(new Buffer(request.substring(hash.length + 10), 'binary').toString('utf8'));
};

// Generate a new session for the user identified by the token.
servers.Auth.prototype.tokenLogin = function(req, res, next) {
    if (req.method.toLowerCase() !== 'get') return next();
    var secret = this.args.model.secret();
    var tokenId = this.decryptExpiringRequest(req.params.id, secret);

    if (tokenId) {
        var status = this.status.bind(this);
        new this.args.model({ id: tokenId }).fetch({
            success: function(model, resp) {
                req.session.regenerate(function() {
                    req.session.user = model;
                    req.session.user.authenticated = true;
                    status(req, res, next);
                });
            },
            error: function() {
                next(new Error.HTTP(403));
            }
        });

    } else {
        next(new Error.HTTP(403));
    }
};

// Generate an email object with a login token.
servers.Auth.prototype.generateEmail = function(model, req) {
    var secret = this.args.model.secret();
    var token = this.encryptExpiringRequest(model.id, secret);

    var body = templates.ResetPasswordEmail({ token: token, host: req.headers.host });

    var mail = new email.Email({
        from: Bones.plugin.config.adminEmail || 'test@example.com',
        to: '<' + model.get('email') + '>',
        bodyType: 'html',
        subject: 'Your password has been reset.',
        body: body
    });

    return mail;
};

// Send an email to the user containing a login link with a token.
servers.Auth.prototype.authEmail = function(req, res, next) {
    var that = this;

    // TODO: How is this access-protected?
    new this.args.model({id: req.params.id}).fetch({
        success: function(model, resp) {
            if (!model.get('email') || !email.isValidAddress(model.get('email'))) {
                next(new Error.HTTP('Invalid email address', 400));
            }
            else {
                that.generateEmail(model, req).send(function(err) {
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
};
