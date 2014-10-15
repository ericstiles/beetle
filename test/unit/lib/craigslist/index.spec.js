'use strict';
var should = require('should'),
    request = require('supertest'),
    nock = require('nock'),
    fs = require('fs'),
    fse = require('fs-extra'),
    qfs = require('q-io/fs'),
    path = require('path'),
    http = require('q-io/http'),
    Q = require('q'),
    _ = require('underscore'),
    utils = require('../../../../lib/utils/index.js'),
    CONFIG = require("config"),
    requirehelper = require('../../../../test/require_helper.js'),
    cl = requirehelper('lib/craigslist/index.js');

var testSuccessUrl, testFailUrl;

var cursole = function(pre, post) {
    return function(message) {
        if (!_.isUndefined(pre) && !_.isNull(pre)) console.log(pre);
        console.log(message);
        if (!_.isUndefined(post) && !_.isNull(post)) console.log(post);
    };
};
/**
 * [description]
 * @return {[type]} [description]
 */
beforeEach(function() {
    //Reading file synchronously to be sure it's loaded before testing
    //May be promise available for testing
    nock('http://www.craigslist.org')
        .get('/about/sites').times(4)
        .reply(200, fs.readFileSync(path.resolve(CONFIG.ROOT, CONFIG.TEST_SUPPORT_FILES, CONFIG.SITES_200_RESPONSE_FILENAME)))
        .get('/bad/url')
        .reply(404, fs.readFileSync(path.resolve(CONFIG.ROOT, CONFIG.TEST_SUPPORT_FILES, CONFIG.SITES_404_RESPONSE_FILENAME)));
    testSuccessUrl = 'http://www.craigslist.org/about/sites';
    testFailUrl = 'http://www.craigslist.org/bad/url';
});

describe('Test SPEC for craigslist sites html page', function() {
    it('should parse html page and return array of domains including state of city domain', function(done) {
        var options = {
            hostname: utils.parseHostName(testSuccessUrl),
            path: utils.parsePathName(testSuccessUrl),
            method: 'GET'
        };
        utils.getHTTPRequest(options)
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
        };
        qfs.read(path.resolve(CONFIG.ROOT, CONFIG.TEST_SUPPORT_FILES, 'promises-city-domains.json'))
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
        qfs.read(path.resolve(CONFIG.ROOT, CONFIG.TEST_SUPPORT_FILES, 'promises-city-domains-filtered.json'))
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
        };
        qfs.read(path.resolve(CONFIG.ROOT, CONFIG.TEST_SUPPORT_FILES, 'promises-city-domains-filtered.json'))
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
                return success;
            })
            .then(cl.getAdPagesFromCityDomains,
                function(error) {
                    done(error);
                })
            .then(function(results) {
                var htmlArray = [];
                results.forEach(function(result, error) {
                    //  NEED TO TEST TO VALIDATE SUCCESS
                    if (result.state === 'fulfilled') {
                        // This item was loaded!
                        htmlArray.push(result.value);
                        // console.log(result.value);
                    } else {
                        // This item failed to be loaded :(
                        error.message = result.reason + ":" + error.message;
                        throw error;
                    }
                });
                (htmlArray.length).should.eql(2);
                done();
            })
    });
    it('should parse an array of html and return an array of ads', function(done) {
            this.timeout(6500);
            qfs.read(path.resolve(CONFIG.ROOT, CONFIG.TEST_SUPPORT_FILES, 'test-ad.html'))
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
        // it('should write an html page of ads given an array of ads', function(done) {
        //     done();
        // });
});
describe('Test parsing node to get ad information', function() {
    it('should parse html as a dom node and return an ad', function(done) {
        var additionalProperties = {
            domainLocation: 'auburn',
            domain: 'http://auburn.craigslist.org',
            state: 'Alabama'
        };
        var innerAdsHTML = fse.readJson(path.resolve(CONFIG.ROOT, CONFIG.TEST_SUPPORT_FILES, CONFIG.HTML_ADS_TO_PARSE), function(error, success) {
            cl.parseListingPNode(success, additionalProperties);
        });
        console.log('test not implemented');

        done();

    });
});
describe('Test SPEC for processing cli arguments', function() {
    it('should process fileName when correctly provided on cli', function(done) {

        var arg_fileName_good_1 = "[{ '0': '-filename=test.html' }]";
        var arg_fileName_good_2 = "[{ '0': '-filename=test.html', '1': '-filename=test2.html' }]";

        var result = cl.processArgs(eval(arg_fileName_good_1)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(CONFIG.ROOT, CONFIG.STORAGE));

        var result = cl.processArgs(eval(arg_fileName_good_2)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(CONFIG.ROOT, CONFIG.STORAGE));
        done();
    });
    it('should return default fileName when cli is not correctly provided on cli', function(done) {

        var arg_fileName_bad_1 = "[{ '0': '-filename', }]";
        var arg_fileName_bad_2 = "[{ '0': '-filename=' }]";
        var arg_fileName_bad_3 = "[{ '0': '-filenameindex.html' }]";
        var arg_fileName_bad_4 = "[{ '0': '-filename', '1': '-filename=test.html' }]";
        var arg_fileName_bad_5 = "[{ '0': '-filename=', '1': '-filename=test.html' }]";
        var arg_fileName_bad_6 = "[{ '0': '-filenameindex.html', '1': '-filename=test.html' }]";

        var result = cl.processArgs(eval(arg_fileName_bad_1)[0]);
        result.filename.should.eql('index.html');
        result.filepath.should.eql(path.resolve(CONFIG.ROOT, CONFIG.STORAGE));

        result = cl.processArgs(eval(arg_fileName_bad_2)[0]);
        result.filename.should.eql('index.html');
        result.filepath.should.eql(path.resolve(CONFIG.ROOT, CONFIG.STORAGE));

        result = cl.processArgs(eval(arg_fileName_bad_3)[0]);
        result.filename.should.eql('index.html');
        result.filepath.should.eql(path.resolve(CONFIG.ROOT, CONFIG.STORAGE));

        result = cl.processArgs(eval(arg_fileName_bad_4)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(CONFIG.ROOT, CONFIG.STORAGE));

        done();
    });

    it('should return provided fileName when a bad value and then a good value are provided on cli', function(done) {

        var arg_fileName_bad_4 = "[{ '0': '-filename', '1': '-filename=test.html' }]";
        var arg_fileName_bad_5 = "[{ '0': '-filename=', '1': '-filename=test.html' }]";
        var arg_fileName_bad_6 = "[{ '0': '-filenameindex.html', '1': '-filename=test.html' }]";

        var result = cl.processArgs(eval(arg_fileName_bad_4)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(CONFIG.ROOT, CONFIG.STORAGE));

        result = cl.processArgs(eval(arg_fileName_bad_5)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(CONFIG.ROOT, CONFIG.STORAGE));

        result = cl.processArgs(eval(arg_fileName_bad_6)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(CONFIG.ROOT, CONFIG.STORAGE));
        done();
    });

    it('should return provided fileName when a good value and then a bad value are provided on cli', function(done) {

        var arg_fileName_bad_4 = "[{'0': '-filename=test.html', '1': '-filename' }]";
        var arg_fileName_bad_5 = "[{'0': '-filename=test.html', '1': '-filename=' }]";
        var arg_fileName_bad_6 = "[{'0': '-filename=test.html', '1': '-filenameindex.html' }]";

        var result = cl.processArgs(eval(arg_fileName_bad_4)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(CONFIG.ROOT, CONFIG.STORAGE));

        result = cl.processArgs(eval(arg_fileName_bad_5)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(CONFIG.ROOT, CONFIG.STORAGE));

        result = cl.processArgs(eval(arg_fileName_bad_6)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(CONFIG.ROOT, CONFIG.STORAGE));
        done();
    });
    it('should process state(s) when correctly provided on cli', function(done) {

        var arg_fileName_good_1 = "[{ '0': '-states=Texas' }]";
        var arg_fileName_good_2 = "[{ '0': '-filename=test.html', '1': '-filename=test2.html', '3': '-states=Texas' }]";
        var arg_fileName_good_3 = "[{ '0': '-states=Texas,Louisiana' }]";
        var arg_fileName_good_4 = "[{ '0': '-filename=test.html', '1': '-filename=test2.html', '3': '-states=Texas,Louisiana' }]";
        var result = cl.processArgs(eval(arg_fileName_good_1)[0]);
        result.states.should.be.instanceof(Array).and.have.lengthOf(1);

        var result = cl.processArgs(eval(arg_fileName_good_2)[0]);
        result.states.should.be.instanceof(Array).and.have.lengthOf(1);

        result = cl.processArgs(eval(arg_fileName_good_3)[0]);
        result.states.should.be.instanceof(Array).and.have.lengthOf(2);

        result = cl.processArgs(eval(arg_fileName_good_4)[0]);
        result.states.should.be.instanceof(Array).and.have.lengthOf(2);

        done();
    });
    // it('should return default fileName when cli is not correctly provided on cli', function(done) {

    //     var arg_fileName_bad_1 = "[{ '0': '-filename', }]";
    //     var arg_fileName_bad_2 = "[{ '0': '-filename=' }]";
    //     var arg_fileName_bad_3 = "[{ '0': '-filenameindex.html' }]";
    //     var arg_fileName_bad_4 = "[{ '0': '-filename', '1': '-filename=test.html' }]";
    //     var arg_fileName_bad_5 = "[{ '0': '-filename=', '1': '-filename=test.html' }]";
    //     var arg_fileName_bad_6 = "[{ '0': '-filenameindex.html', '1': '-filename=test.html' }]";

    //     var result = cl.processArgs(eval(arg_fileName_bad_1)[0]);
    //     result.filename.should.eql('index.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     result = cl.processArgs(eval(arg_fileName_bad_2)[0]);
    //     result.filename.should.eql('index.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     result = cl.processArgs(eval(arg_fileName_bad_3)[0]);
    //     result.filename.should.eql('index.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     result = cl.processArgs(eval(arg_fileName_bad_4)[0]);
    //     result.filename.should.eql('test.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     done();
    // });

    // it('should return provided fileName when a bad value and then a good value are provided on cli', function(done) {

    //     var arg_fileName_bad_4 = "[{ '0': '-filename', '1': '-filename=test.html' }]";
    //     var arg_fileName_bad_5 = "[{ '0': '-filename=', '1': '-filename=test.html' }]";
    //     var arg_fileName_bad_6 = "[{ '0': '-filenameindex.html', '1': '-filename=test.html' }]";

    //     var result = cl.processArgs(eval(arg_fileName_bad_4)[0]);
    //     result.filename.should.eql('test.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     result = cl.processArgs(eval(arg_fileName_bad_5)[0]);
    //     result.filename.should.eql('test.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     result = cl.processArgs(eval(arg_fileName_bad_6)[0]);
    //     result.filename.should.eql('test.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))
    //     done();
    // });

    // it('should return provided fileName when a good value and then a bad value are provided on cli', function(done) {

    //     var arg_fileName_bad_4 = "[{'0': '-filename=test.html', '1': '-filename' }]";
    //     var arg_fileName_bad_5 = "[{'0': '-filename=test.html', '1': '-filename=' }]";
    //     var arg_fileName_bad_6 = "[{'0': '-filename=test.html', '1': '-filenameindex.html' }]";

    //     var result = cl.processArgs(eval(arg_fileName_bad_4)[0]);
    //     result.filename.should.eql('test.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     result = cl.processArgs(eval(arg_fileName_bad_5)[0]);
    //     result.filename.should.eql('test.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     result = cl.processArgs(eval(arg_fileName_bad_6)[0]);
    //     result.filename.should.eql('test.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))
    //     done();
    // });

});
