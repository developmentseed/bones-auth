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
describe('auth', function() {
    var server;
    before(function(done) {
        require('./fixture/start')(function(err, command) {
            server = command.servers['Core'];
            done();
        });
    });
    after(function() { server.close(); });
    it('should GET user model', function(done) {
        assert.response(server, {
            url: '/api/User/root',
            method: 'GET'
        }, {
            body: '{"id":"root","email":"test@example.com"}',
            status: 200
        }, function() {
            assert.response(server, {
                url: '/api/User',
                method: 'GET'
            }, { status: 200 }, function(err, res) {
                var body = _(JSON.parse(res.body)).sortBy(function(r) { return r.id; });
                var equals = _([
                    { id: 'root', email: 'test@example.com' },
                    { id: 'noemail' },
                    { id: 'invalidemail', email: 'so not a valid email address!' },
                    { id: 'resetpassword', email: 'test@example.com' }
                ]).sortBy(function(r) { return r.id; });
                assert.deepEqual(body, equals);
                done();
            });
        });
    });
    it('should GET authentication', function(done) {
        assert.response(server, {
            url: '/api/Auth',
            method: 'GET'
        }, {
            body: '{"id":null}',
            status: 200
        }, function(err, res) {
            assert.ok(!res.headers['set-cookie']);
            done();
        });
    });
    describe('session loading', function() {
        it('should load a session that is not loaded', function(done) {
            assert.response(server, {
                url: '/session'
            }, {
                body: 'false',
                status: 200
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
        it('should load anonymous session', function(done) {
            assert.response(server, {
                url: '/session',
                headers: {
                    'cookie': 'bones.token=cc2a2513dfaa925dc0c7ef5cb33e612b'
                }
            }, {
                body: 'false',
                status: 200
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
        it('should load real session', function(done) {
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
            }, function(err, res) {
                assert.ok(res.headers['set-cookie']);
                var cookies = parseCookies(res.headers['set-cookie']);
                assert.equal(cookies['bones.auth'].value, 'yes');
                assert.response(server, {
                    url: '/session',
                    headers: {
                        'cookie': 'connect.sid=' + cookies['connect.sid'].value
                    }
                }, {
                    status: 200
                }, function(err, res) {
                    var session = JSON.parse(res.body);
                    assert.ok(session.lastAccess);
                    assert.ok(session.cookie);
                    assert.deepEqual(session.user, { id: 'root', email: 'test@example.com' });
                    assert.response(server, {
                        url: '/model',
                        headers: {
                            'cookie': 'connect.sid=' + cookies['connect.sid'].value
                        }
                    }, {
                        status: 200
                    }, function(err, res) {
                        assert.ok(JSON.parse(res.body).isAuthenticated);
                        assert.ok(JSON.parse(res.body).isModel);
                        done();
                    });
                });
            });
        });
    });
    describe('POST authentication', function() {
        it('should fail without credentials', function(done) {
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
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
        it('should fail without user id or password', function(done) {
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
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
        it('should fail without user id or password (JSON)', function(done) {
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
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
        it('should fail without password', function(done) {
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
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
        it('should fail without password (JSON)', function(done) {
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
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
        it('should fail without user id', function(done) {
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
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
        it('should fail without user id (JSON)', function(done) {
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
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
        it('should fail with invalid password', function(done) {
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
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
        it('should fail with invalid password (JSON)', function(done) {
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
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
        it('should fail without token in body', function(done) {
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
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
        it('should fail without token in body (JSON)', function(done) {
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
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
        it('should fail without token in cookie', function(done) {
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
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
        it('should fail without token in cookie (JSON)', function(done) {
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
            }, function(err, res) {
                assert.ok(!res.headers['set-cookie']);
                done();
            });
        });
    });
    describe('login-status-logout sequence', function() {
        it('should succeed', function(done) {
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
            }, function(err, res) {
                var cookies = parseCookies(res.headers['set-cookie']);
                assert.equal(cookies['bones.auth'].value, 'yes');
                assert.response(server, {
                    url: '/api/Auth',
                    method: 'GET',
                    headers: {
                        'cookie': 'connect.sid=' + cookies['connect.sid'].value
                    }
                }, {
                    body: '{"id":"root","email":"test@example.com"}',
                    status: 200
                }, function(err, res) {
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
                    }, function(err, res) {
                        var cookies = parseCookies(res.headers['set-cookie']);
                        // Test that cookies are unset.
                        assert.equal(cookies['bones.auth'].value, '');
                        assert.equal(cookies['connect.sid'].value, '');
                        assert.response(server, {
                            url: '/api/Auth',
                            method: 'GET'
                        }, {
                            body: '{"id":null}',
                            status: 200
                        }, function(err, res) {
                            assert.ok(!res.headers['set-cookie']);
                            done();
                        });
                    });
                });
            });
        });
    });
});
