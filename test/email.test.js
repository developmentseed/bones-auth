process.env.NODE_ENV = 'test';

var assert = require('assert');
var spawn = require('child_process').spawn;
var fs = require('fs');

require('./fixture');
var fixture = require('bones').plugin;
var server = new fixture.servers['Core'](fixture);

exports['test password reset'] = function() {
    
    // Test that non-existent users get access denied
    assert.response(server, {
        url: '/api/AuthEmail/invalid',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4',
            'accept': 'application/json'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
    }, {
        body: '{"message":"Forbidden"}',
        status: 403
    });

    // Test that users without email addresses send error
    assert.response(server, {
        url: '/api/AuthEmail/noemail',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4',
            'accept': 'application/json'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
    }, {
        body: '{"message":"Invalid email address"}',
        status: 400
    });

    // Test that users with invalid email addresses send error
    assert.response(server, {
        url: '/api/AuthEmail/invalidemail',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=1f4a1137268b8e384e50d0fb72c627c4',
            'accept': 'application/json'
        },
        body: JSON.stringify({ "bones.token": "1f4a1137268b8e384e50d0fb72c627c4" })
    }, {
        body: '{"message":"Invalid email address"}',
        status: 400
    });


    // Test that valid email addresses send confirmation
    assert.response(server, {
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
