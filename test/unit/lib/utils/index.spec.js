'use strict';

var should = require('should'),
    request = require('supertest'),
    nock = require('nock'),
    fs = require('fs'),
    fse = require('fs-extra'),
    // qfs = require('q-io/fs'),
    path = require('path'),
    http = require('q-io/http'),
    Q = require('q'),
    _ = require('underscore'),
    CONFIG = require("config"),
    requirehelper = require('../../../../test/require_helper.js'),
    utils = requirehelper('lib/utils/index.js');

var moment = require('moment');

var x = "{text: 'First Option',  value: 'first'}";

var testSuccessUrl, test301Url, test302Url, testFailUrl;

var cursole = function(pre, post) {
    return function(message) {
        if (!_.isUndefined(pre) && !_.isNull(pre)) console.log(pre);
        console.log(message);
        if (!_.isUndefined(post) && !_.isNull(post)) console.log(post);
    };
};

beforeEach(function() {
    //Reading file synchronously to be sure it's loaded before testing
    //May be promise available for testing
    nock('http://www.craigslist.org')
        .get('/about/sites').times(4)
        .reply(200, fs.readFileSync(path.resolve(CONFIG.ROOT, CONFIG.TEST_SUPPORT_FILES, CONFIG.SITES_200_RESPONSE_FILENAME)))
        .get('/about/sites301').times(4)
        .reply(301, fs.readFileSync(path.resolve(CONFIG.ROOT, CONFIG.TEST_SUPPORT_FILES, CONFIG.SITES_200_RESPONSE_FILENAME)))
        .get('/about/sites302').times(4)
        .reply(302, fs.readFileSync(path.resolve(CONFIG.ROOT, CONFIG.TEST_SUPPORT_FILES, CONFIG.SITES_200_RESPONSE_FILENAME)))
        .get('/bad/url')
        .reply(404, fs.readFileSync(path.resolve(CONFIG.ROOT, CONFIG.TEST_SUPPORT_FILES, CONFIG.SITES_404_RESPONSE_FILENAME)));
    testSuccessUrl = 'http://www.craigslist.org/about/sites';
    test301Url = 'http://www.craigslist.org/about/sites301';
    test302Url = 'http://www.craigslist.org/about/sites302';
    testFailUrl = 'http://www.craigslist.org/bad/url';
});

describe('Test SPEC for utility functions', function() {
    it('should parse host name without protocol from given url', function(done) {
        (utils.parseHostName(testSuccessUrl)).should.eql('www.craigslist.org');
        (utils.parseHostName(utils.parseHostName(testSuccessUrl + "/sites"))).should.eql('www.craigslist.org');
        (utils.parseHostName(undefined) === '').should.be.true;
        (utils.parseHostName(null) === '').should.be.true;
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
    it('should respond with a 301 status code and html page', function(done) {
        var options = {
            hostname: utils.parseHostName(test301Url),
            path: utils.parsePathName(test301Url),
            method: 'GET'
        };

        var successResponse = function(response) {
            (response.status).should.eql(301);
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
    it('should respond with a 302 status code and html page', function(done) {
        var options = {
            hostname: utils.parseHostName(test302Url),
            path: utils.parsePathName(test302Url),
            method: 'GET'
        };

        var successResponse = function(response) {
            (response.status).should.eql(302);
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
    it('should format date correctly', function(done) {
        var options = {
            date: '2014 09 10',
            format: 'YYYY MM DD',
            parse: 'YYYY MM DD'
        };
        (utils.formatDate(options)).should.eql('2014 09 10');
        options = {
            date: 'Sep 15',
            format: 'MMM DD',
            parse: 'YYYY MM DD'
        };
        (utils.formatDate(options)).should.eql('2014 09 15');
        done();
    });
});
