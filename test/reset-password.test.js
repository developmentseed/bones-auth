var assert = require('assert');
var server = require('./fixture/start').servers.Core;

exports['test password reset'] = function() {
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
