'use strict';

var should = require('should'),
    request = require('supertest'),
    utils = require('./index.js'),
    nock = require('nock'),
    fs = require('fs'),
    fse = require('fs-extra'),
    // qfs = require('q-io/fs'),
    path = require('path'),
    http = require('q-io/http'),
    Q = require('q'),
    _ = require('underscore'),
    utils = require('./index.js'),
    CONFIG = require("config");

var x = "{text: 'First Option',  value: 'first'}";

var testSuccessUrl, testFailUrl;

var cursole = function(pre, post) {
    return function(message) {
        if (!_.isUndefined(pre) && !_.isNull(pre)) console.log(pre);
        console.log(message);
        if (!_.isUndefined(post) && !_.isNull(post)) console.log(post);
    }
};

beforeEach(function() {
    //Reading file synchronously to be sure it's loaded before testing
    //May be promise available for testing
    nock('http://www.craigslist.org')
        .get('/about/sites').times(4)
        .reply(200, fs.readFileSync(path.resolve(__dirname + "/../../../" + CONFIG.ROOT, CONFIG.SITES_200_RESPONSE_FILENAME)))
        .get('/bad/url')
        .reply(404, fs.readFileSync(path.resolve(__dirname + "/../../../" + CONFIG.ROOT, CONFIG.SITES_404_RESPONSE_FILENAME)));
    testSuccessUrl = 'http://www.craigslist.org/about/sites';
    testFailUrl = 'http://www.craigslist.org/bad/url';
});

describe('Test SPEC for utility functions', function() {
    it('should parse host name without protocol from given url', function(done) {
        (utils.parseHostName(testSuccessUrl)).should.eql('www.craigslist.org');
        (utils.parseHostName(utils.parseHostName(testSuccessUrl + "/sites"))).should.eql('www.craigslist.org');
        (_.isUndefined(utils.parseHostName(undefined))).should.be.true;
        (utils.parseHostName(null) === null).should.be.true;
        (utils.parseHostName('')).should.eql('');
        done();
    });
    it('should parse path from given url', function(done) {
        (utils.parsePathName('http://www.somedomain.com/account/search?filter=a#top')).should.be.a.String.and.equal('/account/search');
        (utils.parsePathName(testSuccessUrl)).should.eql('/about/sites');
        (_.isNull(utils.parsePathName(utils.parseHostName(testSuccessUrl)))).should.be.true;
        done();
    });
    it('should respond with a 200 status code and html page', function(done) {
        var options = {
            hostname: utils.parseHostName(testSuccessUrl),
            path: utils.parsePathName(testSuccessUrl),
            method: 'GET'
        };

        var successResponse = function(response) {
            (response.status).should.eql(200);
            return response.body.read();
        };
        utils.getHTTPRequest(options)
            .then(successResponse, function(error) {
                done(e.name + "|" + e.message);
            })
            .then(
                function(body) {
                    (body.toString("utf-8")).should.be.a.String;
                    done();
                },
                function(error) {
                    done(e.name + "|" + e.message)
                });
    });
    it('should respond with a 404 status code and html page', function(done) {
        var options = {
            hostname: utils.parseHostName(testFailUrl),
            path: utils.parsePathName(testFailUrl),
            method: 'GET'
        };
        var failedResponse = function(response) {
            (response.status).should.eql(404);
            return response.body.read();
        };
        utils.getHTTPRequest(options)
            .then(failedResponse, function(error) {
                done(e.name + "|" + e.message);
            })
            .then(
                function(body) {
                    (body.toString("utf-8")).should.be.a.String;
                    done();
                },
                function(error) {
                    done(e.name + "|" + e.message)
                });
    });

});
