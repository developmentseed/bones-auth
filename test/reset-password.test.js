var assert = require('assert');
function parseCookies(arr) {
    var cookies = {};
    arr.forEach(function(str) {
        var parts = str.split(/\s*;\s*/g).map(function(str) { return str.split('='); });
        var first = parts.shift();
        var options = {};
        parts.forEach(function(part) { options[part.shift()] = part.join('=') || true; });
        cookies[first.shift()] = {
            value: first.join('='),
            toString: function() { return str; },
            options: options
        };
    });
    return cookies;
}
describe('reset password', function() {
    var server;
    var auth;
    var model;
    var user;
    before(function(done) {
        require('./fixture/start')(function(err, command) {
            server = command.servers['Core'];
            auth = require('bones').plugin.servers.Auth.prototype;
            model = require('bones').plugin.models.User;
            new model({ id: 'resetpassword' }).fetch({
                success: function(u, resp) {
                    user = u;
                    done();
                },
                error: function(user, resp) { done(resp) }
            });
        });
    });
    after(function() { server.close(); });
    it('should deny access to non-existent users', function(done) {
        assert.response(server, {
            url: '/api/reset-password/invalid',
            method: 'POST',
            headers: {
                'host': 'localhost:3000',
                'content-type': 'application/json',
                'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4',
                'accept': 'application/json'
            },
            body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
        }, {
            body: /"message":"Forbidden"/,
            status: 403
        }, done);
    });
    it('should return error for users without email addresses', function(done) {
        assert.response(server, {
            url: '/api/reset-password/noemail',
            method: 'POST',
            headers: {
                'host': 'localhost:3000',
                'content-type': 'application/json',
                'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4',
                'accept': 'application/json'
            },
            body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
        }, {
            body: /"message":"Invalid email address"/,
            status: 409
        }, done);
    });
    it('should return error for users with invalid email addresses', function(done) {
        assert.response(server, {
            url: '/api/reset-password/invalidemail',
            method: 'POST',
            headers: {
                'host': 'localhost:3000',
                'content-type': 'application/json',
                'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4',
                'accept': 'application/json'
            },
            body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
        }, {
            body: /"message":"Invalid email address"/,
            status: 409
        }, done);
    });
    it('should send confirmation for users with valid email addresses', function(done) {
        assert.response(server, {
            url: '/api/reset-password/root',
            method: 'POST',
            headers: {
                'host': 'localhost:3000',
                'content-type': 'application/json',
                'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4',
                'accept': 'application/json'
            },
            body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
        }, {
            body: /"message":"Email has been sent"/,
            status: 200
        }, done);
    });
    describe('logging in', function() {
        it('should fail with a tampered token', function(done) {
            // Generate a fake token
            var token = 'a' + auth.encryptExpiringRequest(user.id, model.secret(), user.password);

            assert.response(server, {
                url: '/reset-password/' + token
            }, {
                body: /Invalid login token/,
                status: 403
            }, done);
        });
        var token;
        it('should work with a valid token', function(done) {
            token = auth.encryptExpiringRequest(user.id, model.secret(), user.password);
            // First login with token.
            assert.response(server, {
                url: '/reset-password/' + token
            }, {
                body: 'Successfully logged in!',
                status: 200
            }, function(err, res) {
                var cookies = parseCookies(res.headers['set-cookie']);
                assert.response(server, {
                    url: '/api/Auth',
                    headers: {
                        'cookie': 'connect.sid=' + cookies['connect.sid'].value
                    }
                }, {
                    body: '{"id":"resetpassword","email":"test@example.com"}',
                    status: 200
                }, done);
            });
        });
        it('should fail with a reused token', function(done) {
            assert.response(server, {
                url: '/reset-password/' + token
            }, {
                body: /Invalid login token/,
                status: 403
            }, done);
        });
        it('should fail with an expired token', function(done) {
            var token = 'ZEGlanrY47AMHnWGtJBTgLuYInfq5ouUCqF0jCWtzN8Xj5+nCBFfBrxIy9HmX32w3v7u3DqOSZfv';

            assert.response(server, {
                url: '/reset-password/' + token
            }, {
                body: /Invalid login token/,
                status: 403
            }, done);
        });
    });
});
