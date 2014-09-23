'use strict';

var should = require('should'),
    request = require('supertest'),
    cl = require('./index.js'),
    nock = require('nock'),
    fs = require('fs'),
    fse = require('fs-extra'),
    qfs = require('q-io/fs'),
    path = require('path'),
    http = require('q-io/http'),
    Q = require('q'),
    _ = require('underscore'),
    CONFIG = require("config");

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

describe('Test SPEC for craigslist sites html page', function() {
    it('should parse host name without protocol from given url', function(done) {
        (cl.parseHostName(testSuccessUrl)).should.eql('www.craigslist.org');
        (cl.parseHostName(cl.parseHostName(testSuccessUrl + "/sites"))).should.eql('www.craigslist.org');
        (_.isUndefined(cl.parseHostName(undefined))).should.be.true;
        (cl.parseHostName(null) === null).should.be.true;
        (cl.parseHostName('')).should.eql('');
        done();
    });
    it('should parse path from given url', function(done) {
        (cl.parsePathName('http://www.somedomain.com/account/search?filter=a#top')).should.be.a.String.and.equal('/account/search');
        (cl.parsePathName(testSuccessUrl)).should.eql('/about/sites');
        (_.isNull(cl.parsePathName(cl.parseHostName(testSuccessUrl)))).should.be.true;
        done();
    });
    it('should respond with a 200 status code and html page', function(done) {
        var options = {
            hostname: cl.parseHostName(testSuccessUrl),
            path: cl.parsePathName(testSuccessUrl),
            method: 'GET'
        };

        var successResponse = function(response) {
            (response.status).should.eql(200);
            return response.body.read();
        };
        cl.getHTTPRequest(options)
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
            hostname: cl.parseHostName(testFailUrl),
            path: cl.parsePathName(testFailUrl),
            method: 'GET'
        };
        var failedResponse = function(response) {
            (response.status).should.eql(404);
            return response.body.read();
        };
        cl.getHTTPRequest(options)
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
    // it('should write a file to test location', function(done) {
    //     var options = {
    //         filepath: path.resolve(__dirname + "/../../../" + CONFIG.STORAGE, CONFIG.WRITE_TXT_FILENAME),
    //         contents: 'test contents'
    //     }
    //     cl.writeFile(options)
    //     //NEED TO WRAP WITH PROMISE TO VALIDATE SUCCESS
    //     done();
    // });
    // it('should write json to test location', function(done) {
    //     var options = {
    //         filepath: path.resolve(__dirname + "/../../../" + CONFIG.STORAGE, CONFIG.WRITE_JSON_FILENAME),
    //         contents: {
    //             test: 'contents'
    //         }
    //     }
    //     cl.writeJSON(options)
    //         .then(
    //             function(error, success) {
    //                 if (!_.isUndefined(error) && !_.isNull(error)) {
    //                     done();
    //                 } else {
    //                     done(error);
    //                 }
    //             }
    //     )
    // });
    it('should parse html page and return array of domains including state of city domain', function(done) {
        var options = {
            hostname: cl.parseHostName(testSuccessUrl),
            path: cl.parsePathName(testSuccessUrl),
            method: 'GET'
        };
        cl.getHTTPRequest(options)
            .then(
                cl.parseSitesHTML,
                function(error) {
                    console.log("ERROR:" + error).then(
                        function(success, error) {
                            if (error) {
                                done(error);
                            } else {
                                done("Successful path in onRejected called");
                            }
                        },
                        function(error) {
                            done(error);
                        }
                    );
                })
            .then(
                function(success, error) {
                    if (error) {
                        done(error);
                    } else {
                        (success).should.be.an.Array;
                        (success.length).should.eql(712)
                        done();
                    }
                },
                function(error) {
                    done(error);
                });
    });
    it('should filter a list of domains given a function that validates on state', function(done) {
        var filterOptions = {
            array: [{
                title: 'dothan',
                host: 'http://dothan.craigslist.org',
                state: 'Alabama'
            }],
            predicate: function(value) {
                return value.state === 'Texas';
            }
        }
        qfs.read(path.resolve(__dirname + "/../../../" + CONFIG.ROOT, 'promises-city-domains.json'))
            .then(function(success, error) {
                filterOptions.array = JSON.parse(success.toString("utf-8"));
                return filterOptions;
            }, function(error) {
                done(error);
            })
            .then(cl.filterDomains, function(error) {
                done(error);
            })
            .then(function(success, error) {
                    (success.length).should.eql(27);
                    ((_.isUndefined(error) || _.isNull(error))).should.be.ok;
                    done();
                },
                function(error) {
                    done(error);
                });
    });
    it('should return a single html responses given an array of one domain', function(done) {
        var filterOptions = {
            array: [],
            predicate: function(value) {
                return value.title === 'dothan';
            }
        }
        qfs.read(path.resolve(__dirname + "/../../../" + CONFIG.ROOT, 'promises-city-domains-filtered.json'))
            .then(
                function(success, error) {
                    filterOptions.array = JSON.parse(success.toString("utf-8"));
                    return filterOptions;
                },
                function(error) {
                    done(error);
                })
            .then(cl.filterDomains, function(error) {
                done(error);
            })
            .then(cl.getAdPagesFromSingleCityDomain,
                function(error) {
                    done(error);
                })
            .then(function(success, error) {
                //SHOULD VALIDATE HTML;
                // console.log(success.toString("utf-8"))
                done();
            })
    });

    it('should return an array of html responses given an array of domains', function(done) {
        this.timeout(3500);
        var filterOptions = {
            array: [],
            predicate: function(value) {
                return value.title === 'dothan' || value.title === 'auburn';
            }
        }
        qfs.read(path.resolve(__dirname + "/../../../" + CONFIG.ROOT, 'promises-city-domains-filtered.json'))
            .then(
                function(success, error) {
                    filterOptions.array = JSON.parse(success.toString("utf-8"));
                    return filterOptions;
                },
                function(error) {
                    done(error);
                })
            .then(cl.filterDomains, function(error) {
                done(error);
            })
            .then(function(success, error) {
                // console.log(success);
                // console.log(error);
                return success;
            })
            .then(cl.getAdPagesFromCityDomains,
                function(error) {
                    done(error);
                })
            .then(function(results) {
                // console.log("Q is now settled");
                var htmlArray = [];
                results.forEach(function(result, error) {
                    //  NEED TO TEST TO VALIDATE SUCCESS
                    // console.log("ERROR:" + error);
                    // console.log("Results is an Object:" + _.isObject(results));
                    // console.log("Results is a Promise:" + Q.isPromise(results));
                    if (result.state === 'fulfilled') {
                        // This item was loaded!
                        // console.log(result.state);
                        htmlArray.push(result.value);
                        // console.log(result.value);
                    } else {
                        // This item failed to be loaded :(
                        error.message = result.reason + ":" + error.message;
                        throw error;
                    }
                });
                (htmlArray.length).should.eql(2);
                // var props = _.keys(htmlArray[0]);
                // console.log(props);
                // console.log(htmlArray[0]);
                // (props).should.eql(4);
                // (_.keys(htmlArray[0])['html'] !== undefined && _.keys(htmlArray[0])['html'] !== null).should.be.true;
                done();
            })
    });
    it('should parse an array of html and return an array of ads', function(done) {
        this.timeout(6500);
        qfs.read(path.resolve(__dirname + "/../../../" + CONFIG.ROOT, 'test-ad.html'))
            .then(
                function(success, error) {
                    var testHTMLArray = [],
                        ad = {};
                    ad.html = success.toString("utf-8");
                    ad.title = 'auburn';
                    ad.host = 'http://auburn.craigslist.org';
                    ad.state = 'Alabama';
                    testHTMLArray.push(ad);
                    return testHTMLArray;
                },
                function(error) {
                    done(error);
                })
            .then(
                cl.parseAdsFromHTMLArray,
                function(error) {
                    done(error);
                })
            .then(function(success, error) {
                    // console.log("success:" + _.isArray(success));
                    (success.length).should.be.eql(99);
                    //NEED TO TEST RESULTS BY COUNTING ARRAY AND CONFIRMING 
                    //PROPERTIES EXIST IN ALL OF THEM
                    if (error) {
                        done(error);
                    } else {
                        done();
                    }
                },
                function(error) {
                    done(error);
                });
    })
    it('should write an html page of ads given an array of ads', function(done) {
        done();
    });
});
