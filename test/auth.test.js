var assert = require('assert');
var server = require('./fixture/start').servers.Core;

exports['test GET user model'] = function(beforeExit) {
    assert.response(server, {
        url: '/api/User/root',
        method: 'GET'
    }, {
        body: '{"id":"root","email":"test@example.com"}',
        status: 200
    });

    assert.response(server, {
        url: '/api/User',
        method: 'GET'
    }, { status: 200 }, function(res) {
        var body = _(JSON.parse(res.body)).sortBy(function(r) { return r.id });
        var equals = _([
            { id: 'root', email: 'test@example.com' },
            { id: 'noemail' },
            { id: 'invalidemail', email: 'so not a valid email address!' },
            { id: 'resetpassword', email: 'test@example.com' }
        ]).sortBy(function(r) { return r.id; });
        assert.deepEqual(body, equals);
    });
};

exports['test GET authentication'] = function(beforeExit) {
    assert.response(server, {
        url: '/api/Auth',
        method: 'GET'
    }, {
        body: '{"id":null}',
        status: 200
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });
};

exports['test session loading'] = function(beforeExit) {
    // Test that session isn't loaded
    assert.response(server, {
        url: '/session'
    }, {
        body: 'false',
        status: 200
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });

    // Test anonymous session
    assert.response(server, {
        url: '/session',
        headers: {
            'cookie': 'bones.token=cc2a2513dfaa925dc0c7ef5cb33e612b'
        }
    }, {
        body: 'false',
        status: 200
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });

    // Test real session
    assert.response(server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=9e970a6908c7b53fced9a2e46634b41d'
        },
        body: JSON.stringify({ "bones.token": "9e970a6908c7b53fced9a2e46634b41d", id: 'root', password: 'test' })
    }, {
        body: '{"id":"root","email":"test@example.com"}',
        status: 200
    }, function(res) {
        assert.ok(res.headers['set-cookie']);
        assert.response(server, {
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
        assert.response(server, {
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
    assert.response(server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
    }, {
        body: /Invalid login/,
        status: 403
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });

    assert.response(server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
    }, {
        body: /"message":"Invalid login"/,
        status: 403
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });

    assert.response(server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", id: 'root' })
    }, {
        body: /Invalid login/,
        status: 403
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });

    assert.response(server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", id: 'root' })
    }, {
        body: /"message":"Invalid login"/,
        status: 403
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });

    assert.response(server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", password: 'test' })
    }, {
        body: /Invalid login/,
        status: 403
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });

    assert.response(server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", password: 'test' })
    }, {
        body: /"message":"Invalid login"/,
        status: 403
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });

    assert.response(server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", id: 'root', password: 'bar' })
    }, {
        body: /Invalid login/,
        status: 403
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });

    assert.response(server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", id: 'root', password: 'bar' })
    }, {
        body: /"message":"Invalid login"/,
        status: 403
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });

    // Test login without token in body
    assert.response(server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ id: 'root', password: 'test' })
    }, {
        body: /Forbidden/,
        status: 403
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });


    // Test login without token in body
    assert.response(server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ id: 'root', password: 'test' })
    }, {
        body: /"message":"Forbidden"/,
        status: 403
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });

    // Test login without token in cookie
    assert.response(server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", id: 'root', password: 'test' })
    }, {
        body: /Forbidden/,
        status: 403
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });


    // Test login without token in cookie
    assert.response(server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", id: 'root', password: 'test' })
    }, {
        body: /"message":"Forbidden"/,
        status: 403
    }, function(res) {
        assert.ok(!res.headers['set-cookie']);
    });

    // Test login-status-logout sequence.
    assert.response(server, {
        url: '/api/Auth',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4", id: 'root', password: 'test' })
    }, {
        body: '{"id":"root","email":"test@example.com"}',
        status: 200
    }, function(res) {
        assert.response(server, {
            url: '/api/Auth',
            method: 'GET',
            headers: {
                'cookie': res.headers['set-cookie'][0].replace(/;.+$/, '')
            }
        }, {
            body: '{"id":"root","email":"test@example.com"}',
            status: 200
        }, function(res) {
            assert.response(server, {
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
                assert.response(server, {
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
};
