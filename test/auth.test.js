var assert = require('assert');
var spawn = require('child_process').spawn;
var fs = require('fs');

var fixture = require('./fixture');
var main = fixture.start();
main.servers['Auth'].server.close();

exports['test GET authentication'] = function(beforeExit) {
    assert.response(main.servers['Auth'].server, {
        url: '/api/authentication',
        method: 'GET'
    }, {
        body: '{"id":null}',
        status: 200
    });
};

exports['test POST authentication'] = function (beforeExit) {
    assert.response(main.servers['Auth'].server, {
        url: '/api/authentication',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({})
    }, {
        body: '{"error":"Access denied"}',
        status: 403
    });

    assert.response(main.servers['Auth'].server, {
        url: '/api/authentication',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'root' })
    }, {
        body: '{"error":"Access denied"}',
        status: 403
    });

    assert.response(main.servers['Auth'].server, {
        url: '/api/authentication',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'test' })
    }, {
        body: '{"error":"Access denied"}',
        status: 403
    });

    assert.response(main.servers['Auth'].server, {
        url: '/api/authentication',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'root', password: 'bar' })
    }, {
        body: '{"error":"Access denied"}',
        status: 403
    });

    // Test login-status-logout sequence.
    assert.response(main.servers['Auth'].server, {
        url: '/api/authentication',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'root', password: 'test' })
    }, {
        body: '{"id":"root"}',
        status: 200
    }, function(res) {
        assert.response(main.servers['Auth'].server, {
            url: '/api/authentication',
            method: 'GET',
            headers: {
                'cookie': res.headers['set-cookie'][0].replace(/;.+$/, '')
            }
        }, {
            body: '{"id":"root"}',
            status: 200
        }, function(res) {
            assert.response(main.servers['Auth'].server, {
                url: '/api/authentication',
                method: 'DELETE',
                headers: {
                    'cookie': res.headers['set-cookie'][0].replace(/;.+$/, '')
                }
            }, {
                body: '{"id":null}',
                status: 200
            }, function(res) {
                assert.ok(/^connect.sid=;/.test(res.headers['set-cookie'][0]));
                assert.response(main.servers['Auth'].server, {
                    url: '/api/authentication',
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
