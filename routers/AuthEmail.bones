var email = require('email'),
    crypto = require('crypto'),
    fs = require('fs'),
    Buffer = require('buffer').Buffer;

function random(bytes) {
    var fd = fs.openSync('/dev/random', 'r');
    var buf = new Buffer(bytes);
    fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    return buf;
}

// 512 bit key.
var secret = random(64).toString('binary');


// Email verification middleware
// ----------------------------
routers.Auth.augment({
    initialize: _.once(function(parent, app, args) {
        parent.call(this, app, args);

        var url = '/api/AuthEmail/:id';

        if (!args) args = {};
        args.model = args.model || models['User'];
        args.key = args.key || 'connect.sid';

        this.args = args;

        this.authEmail = this.authEmail.bind(this);
        this.tokenLogin = this.tokenLogin.bind(this);
        this.generateEmail = this.generateEmail.bind(this);

        this.server.post(url, this.authEmail);
        this.server.get(url, this.session, this.tokenLogin);
    })
});


// Generate a string containing the date + hour.
routers.Auth.prototype.generateTimecode = function(d) {
    function pad(n){return n<10 ? '0'+n : n}
    return [
        d.getUTCFullYear(),
        pad(d.getUTCMonth()+1),
        pad(d.getUTCDate()),
        pad(d.getUTCHours())
    ].join('');
}

// Turn a string into a hex token encrypted with the secret.
routers.Auth.prototype.encryptExpiringRequest = function(data, secret) {
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
}

// Decrypt a token.
routers.Auth.prototype.decryptExpiringRequest = function(data, secret, maxAge) {
    if (typeof maxAge === 'undefined') maxAge = 86400;
    var decipher = crypto.createDecipher('aes-256-cfb', secret);
    var request = decipher.update(data, 'base64', 'binary') + decipher['final']('binary');
    var hash = crypto.createHash('sha256').update(secret).update(request.substring(32)).digest('binary');
    if (hash !== request.substring(0, hash.length)) return undefined;
    var timestamp = parseInt(request.substring(hash.length, hash.length + 10), 10);
    if ((Date.now() / 1000).toFixed() > (timestamp + maxAge)) return undefined;
    return JSON.parse(new Buffer(request.substring(hash.length + 10), 'binary').toString('utf8'));
}

// Generate a new session for the user identified by the token.
routers.Auth.prototype.tokenLogin = function(req, res, next) {
    if (req.method.toLowerCase() !== 'get') return next();

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
}

// Generate an email object with a login token.
routers.Auth.prototype.generateEmail = function(model, req) {
    var token = this.encryptExpiringRequest(model.id, secret);

    var bodyTemplate = _.template([
        "You password has been reset.",
        "Please follow <a href='http://<%= host %>/reset-password/<%= token %>'>this link.</a>"
    ].join("\n"));

    var body = bodyTemplate({ token: token, host: req.headers.host });

    var mail = new email.Email({
        from: Bones.plugin.config.adminEmail || 'test@example.com',
        to: '<' + model.get('email') + '>',
        bodyType: 'html',
        subject: 'Your password has been reset.',
        body: body
    });

    return mail;
}

// Send an email to the user containing a login link with a token.
routers.Auth.prototype.authEmail = function(req, res, next) {
    if (req.method.toLowerCase() !== 'post') return next();

    var that = this;

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
}
