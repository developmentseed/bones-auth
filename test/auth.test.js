process.env.NODE_ENV = 'test';

var assert = require('assert');
var spawn = require('child_process').spawn;
var fs = require('fs');

require('./fixture');
var fixture = require('bones').plugin;
var auth = new fixture.servers['Auth'](fixture);

exports['test GET authentication'] = function(beforeExit) {
    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'GET'
    }, {
        body: '{"id":null}',
        status: 200
    });
};

exports['test session loading'] = function(beforeExit) {
    // Test that session isn't loaded
    assert.response(auth.server, {
        url: '/session'
    }, {
        body: 'false',
        status: 200
    });

    // Test anonymous session
    assert.response(auth.server, {
        url: '/session',
        headers: {
            'cookie': 'bones.token=cc2a2513dfaa925dc0c7ef5cb33e612b'
        }
    }, {
        body: 'false',
        status: 200
    });

    // Test real session
    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=9e970a6908c7b53fced9a2e46634b41d'
        },
        body: JSON.stringify({ "bones.token": "9e970a6908c7b53fced9a2e46634b41d", id: 'root', password: 'test' })
    }, {
        body: '{"id":"root"}',
        status: 200
    }, function(res) {
        assert.response(auth.server, {
            url: '/session',
            headers: {
                'cookie': res.headers['set-cookie'][0].replace(/;.+$/, '')
            }
        }, {
            status: 200
        }, function(res) {
            var session = JSON.parse(res.body);
            assert.ok(session.lastAccess);
            assert.ok(session.cookie);
            assert.deepEqual(session.user, { id: 'root', email: 'test@example.com' });
        });
        assert.response(auth.server, {
            url: '/model',
            headers: {
                'cookie': res.headers['set-cookie'][0].replace(/;.+$/, '')
            }
        }, {
            status: 200
        }, function(res) {
            assert.ok(JSON.parse(res.body).isAuthenticated);
            assert.ok(JSON.parse(res.body).isModel);
        });
    });
};

exports['test POST authentication'] = function (beforeExit) {
    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
    }, {
        body: 'Forbidden',
        status: 403
    });

    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
    }, {
        body: '{"message":"Forbidden"}',
        status: 403
    });

    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", id: 'root' })
    }, {
        body: 'Forbidden',
        status: 403
    });

    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", id: 'root' })
    }, {
        body: '{"message":"Forbidden"}',
        status: 403
    });

    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", password: 'test' })
    }, {
        body: 'Forbidden',
        status: 403
    });

    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", password: 'test' })
    }, {
        body: '{"message":"Forbidden"}',
        status: 403
    });

    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", id: 'root', password: 'bar' })
    }, {
        body: 'Forbidden',
        status: 403
    });

    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", id: 'root', password: 'bar' })
    }, {
        body: '{"message":"Forbidden"}',
        status: 403
    });

    // Test login without token in body
    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ id: 'root', password: 'test' })
    }, {
        body: 'Forbidden',
        status: 403
    });


    // Test login without token in body
    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ id: 'root', password: 'test' })
    }, {
        body: '{"message":"Forbidden"}',
        status: 403
    });

    // Test login without token in cookie
    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", id: 'root', password: 'test' })
    }, {
        body: 'Forbidden',
        status: 403
    });


    // Test login without token in cookie
    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", id: 'root', password: 'test' })
    }, {
        body: '{"message":"Forbidden"}',
        status: 403
    });

    // Test login-status-logout sequence.
    assert.response(auth.server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", id: 'root', password: 'test' })
    }, {
        body: '{"id":"root"}',
        status: 200
    }, function(res) {
        assert.response(auth.server, {
            url: '/api/Auth',
            method: 'GET',
            headers: {
                'cookie': res.headers['set-cookie'][0].replace(/;.+$/, '')
            }
        }, {
            body: '{"id":"root"}',
            status: 200
        }, function(res) {
            assert.response(auth.server, {
                url: '/api/Auth',
                method: 'DELETE',
                headers: {
                    'content-type': 'application/json',
                    'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4; ' + res.headers['set-cookie'][0].replace(/;.+$/, '')
                },
                body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
            }, {
                body: '{"id":null}',
                status: 200
            }, function(res) {
                assert.ok(/^connect.sid=;/.test(res.headers['set-cookie'][0]));
                assert.response(auth.server, {
                    url: '/api/Auth',
                    method: 'GET'
                }, {
                    body: '{"id":null}',
                    status: 200
                }, function(res) {
                    assert.ok(!res.headers['set-cookie']);
                });
            });
        });
    });

    // Test that non-existent users get access denied
    assert.response(auth.server, {
        url: '/api/AuthEmail/invalid',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
    }, {
        body: '{"error":"Access denied"}',
        status: 403
    });

    // Test that users without email addresses send error
    assert.response(auth.server, {
        url: '/api/AuthEmail/noemail',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
    }, {
        body: '{"error":"Invalid email address"}',
        status: 500
    });

    // Test that valid email addresses send confirmation
    assert.response(auth.server, {
        url: '/api/AuthEmail/root',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
    }, {
        body: '{"message":"Email has been sent"}',
        status: 200
    });


};
