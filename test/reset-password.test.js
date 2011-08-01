var assert = require('assert');
var server = require('./fixture/start').servers.Core;
var auth = require('bones').plugin.servers.Auth.prototype;
var model = require('bones').plugin.models.User;
var user = new model({ id: 'resetpassword' }).fetch({
    success: function(user, resp) {
        exports['test password reset request'] = function() {
            // Test that non-existent users get access denied
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
            });

            // Test that users without email addresses send error
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
            });

            // Test that users with invalid email addresses send error
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
            });

            // Test that valid email addresses send confirmation
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
            });
        };

        exports['test logging in with tampered token'] = function() {
            // Generate a fake token
            var token = 'a' + auth.encryptExpiringRequest(user.id, model.secret(), user.password);

            assert.response(server, {
                url: '/reset-password/' + token
            }, {
                body: /Invalid login token/,
                status: 403
            });
        };

        exports['test logging in with token'] = function() {
            // Generate a fake token
            var token = auth.encryptExpiringRequest(user.id, model.secret(), user.password);

            assert.response(server, {
                url: '/api/Auth',
                method: 'GET'
            }, {
                body: '{"id":null}',
                status: 200
            });

            // First login with token.
            assert.response(server, {
                url: '/reset-password/' + token
            }, {
                body: 'Successfully logged in!',
                status: 200
            }, function(res) {
                assert.response(server, {
                    url: '/api/Auth',
                    headers: {
                        'cookie': res.headers['set-cookie'][0].replace(/;.+$/, '')
                    }
                }, {
                    body: '{"id":"resetpassword","email":"test@example.com"}',
                    status: 200
                });

                // Second login with token must fail.
                assert.response(server, {
                    url: '/reset-password/' + token
                }, {
                    body: /Invalid login token/,
                    status: 403
                });
            });

            // Second login with token must fail.
            assert.response(server, {
                url: '/reset-password/' + token
            }, {
                body: /Invalid login token/,
                status: 403
            });
        };

        exports['test logging in with expired token'] = function() {
            var token = 'ZEGlanrY47AMHnWGtJBTgLuYInfq5ouUCqF0jCWtzN8Xj5+nCBFfBrxIy9HmX32w3v7u3DqOSZfv';

            assert.response(server, {
                url: '/reset-password/' + token
            }, {
                body: /Invalid login token/,
                status: 403
            });
        };
    }
});
