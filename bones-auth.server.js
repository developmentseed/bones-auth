var fs = require('fs'),
    crypto = require('crypto'),
    Auth = require('./bones-auth').Auth,
    AuthList = require('./bones-auth').AuthList,
    Bones = require('bones');

// Load AuthView template into Bones templates.
Bones.templates['AuthView'] = Bones.templates['AuthView'] ||
    fs.readFileSync(__dirname + '/AuthView.hbs', 'utf-8');

// Pass through require of bones-auth. Overrides for server-side context below.
module.exports = require('./bones-auth');

// Authentication middleware
// -------------------------
// Factory function that returns a route middleware that should be used at an
// Auth model `authUrl` endpoint.
module.exports.authenticate = function(privateKey, Model) {
    var hash = function(string) {
        return crypto
            .createHmac('sha256', privateKey)
            .update(string)
            .digest('hex');
    };
    // Override parse for Auth model. Filters out passwords server side
    // such that they are never returned to the client. The `password`
    // property is preserved on the original response object enabling
    // authentication code to access the response directly.
    Auth.prototype.parse = function(resp) {
        var filtered = _.clone(resp);
        !_.isUndefined(filtered.password) && (delete filtered.password);
        return filtered;
    };
    // Override sync for Auth model. Hashes passwords when saved to
    // persistence.
    Auth.prototype.sync = function(method, model, success, error) {
        switch (method) {
        case 'create':
        case 'update':
            var authWriteSuccess = function(resp) {
                model.unset('password');
                success(resp);
            };
            var authWriteError = function(resp) {
                model.unset('password');
                error(resp);
            };
            var authWrite = function(data) {
                data.password && model.set(
                    {password: data.password},
                    {silent: true}
                );
                Backbone.sync(method, model, authWriteSuccess, authWriteError);
            };
            if (model.get('passwordConfirm')) model.unset('passwordConfirm');
            if (model.get('password')) {
                authWrite({ password: hash(model.get('password')) });
            } else {
                Backbone.sync('read', model, authWrite, authWrite);
            }
            break;
        default:
            Backbone.sync(method, model, success, error);
            break;
        }
    };
    // Override parse for AuthList collection. Calls `parse` from above on
    // each model, stripping private attributes.
    AuthList.prototype.parse = function(resp) {
        return _.map(resp, this.model.prototype.parse);
    };
    Model = Model || Auth;
    return function(req, res, next) {
        switch (req.body.method) {
        case 'load':
            if (req.session.user) {
                res.send(req.session.user.toJSON());
            } else {
                res.send('Access denied.', 403);
            }
            break;
        case 'logout':
            if (req.session && req.session.user) {
                delete req.session.user;
                res.send({}, 200);
            } else {
                res.send('Access denied.', 403);
            }
            break;
        case 'login':
            var model = new Model({id: req.body.id});
            model.fetch({
                success: function(model, resp) {
                    if (resp.password === hash(req.body.password)) {
                        req.session.regenerate(function() {
                            req.session.user = model;
                            res.send(model.toJSON(), 200);
                        });
                    } else {
                        res.send('Access denied.', 403);
                    }
                },
                error: function() {
                    res.send('Access denied.', 403);
                }
            });
            break;
        default:
            res.send('Access denied.', 403);
            break;
        }
    };
};

