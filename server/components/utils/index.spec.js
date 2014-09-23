'use strict';

var should = require('should'),
    request = require('supertest'),
    utils = require('./index.js'),
    nock = require('nock'),
    fs = require('fs'),
    fse = require('fs-extra'),
    qfs = require('q-io/fs'),
    path = require('path'),
    http = require('q-io/http'),
    Q = require('q'),
    _ = require('underscore'),
    CONFIG = require("config");

// var test = "{ 'a' : 'a' }"
// console.log(JSON.parse(test));




var x = "{text: 'First Option',  value: 'first'}";

describe('Test SPEC for utility functions', function() {
    it('should process fileName when correctly provided on cli', function(done) {

        var arg_fileName_good_1 = "[{ '0': '-filename=test.html' }]";
        var arg_fileName_good_2 = "[{ '0': '-filename=test.html', '1': '-filename=test2.html' }]";

        var result = utils.processArgs(eval(arg_fileName_good_1)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

        var result = utils.processArgs(eval(arg_fileName_good_2)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))
        done();
    });
    it('should return default fileName when cli is not correctly provided on cli', function(done) {

        var arg_fileName_bad_1 = "[{ '0': '-filename', }]";
        var arg_fileName_bad_2 = "[{ '0': '-filename=' }]";
        var arg_fileName_bad_3 = "[{ '0': '-filenameindex.html' }]";
        var arg_fileName_bad_4 = "[{ '0': '-filename', '1': '-filename=test.html' }]";
        var arg_fileName_bad_5 = "[{ '0': '-filename=', '1': '-filename=test.html' }]";
        var arg_fileName_bad_6 = "[{ '0': '-filenameindex.html', '1': '-filename=test.html' }]";

        var result = utils.processArgs(eval(arg_fileName_bad_1)[0]);
        result.filename.should.eql('index.html');
        result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

        result = utils.processArgs(eval(arg_fileName_bad_2)[0]);
        result.filename.should.eql('index.html');
        result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

        result = utils.processArgs(eval(arg_fileName_bad_3)[0]);
        result.filename.should.eql('index.html');
        result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

        result = utils.processArgs(eval(arg_fileName_bad_4)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

        done();
    });

    it('should return provided fileName when a bad value and then a good value are provided on cli', function(done) {

        var arg_fileName_bad_4 = "[{ '0': '-filename', '1': '-filename=test.html' }]";
        var arg_fileName_bad_5 = "[{ '0': '-filename=', '1': '-filename=test.html' }]";
        var arg_fileName_bad_6 = "[{ '0': '-filenameindex.html', '1': '-filename=test.html' }]";

        var result = utils.processArgs(eval(arg_fileName_bad_4)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

        result = utils.processArgs(eval(arg_fileName_bad_5)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

        result = utils.processArgs(eval(arg_fileName_bad_6)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))
        done();
    });

    it('should return provided fileName when a good value and then a bad value are provided on cli', function(done) {

        var arg_fileName_bad_4 = "[{'0': '-filename=test.html', '1': '-filename' }]";
        var arg_fileName_bad_5 = "[{'0': '-filename=test.html', '1': '-filename=' }]";
        var arg_fileName_bad_6 = "[{'0': '-filename=test.html', '1': '-filenameindex.html' }]";

        var result = utils.processArgs(eval(arg_fileName_bad_4)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

        result = utils.processArgs(eval(arg_fileName_bad_5)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

        result = utils.processArgs(eval(arg_fileName_bad_6)[0]);
        result.filename.should.eql('test.html');
        result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))
        done();
    });
    //////////////
    it('should process state(s) when correctly provided on cli', function(done) {

        var arg_fileName_good_1 = "[{ '0': '-states=Texas' }]";
        var arg_fileName_good_2 = "[{ '0': '-filename=test.html', '1': '-filename=test2.html', '3': '-states=Texas' }]";
        var arg_fileName_good_3 = "[{ '0': '-states=Texas,Louisiana' }]";
        var arg_fileName_good_4 = "[{ '0': '-filename=test.html', '1': '-filename=test2.html', '3': '-states=Texas,Louisiana' }]";
        var result = utils.processArgs(eval(arg_fileName_good_1)[0]);
        result.states.should.be.instanceof(Array).and.have.lengthOf(1);

        var result = utils.processArgs(eval(arg_fileName_good_2)[0]);
        result.states.should.be.instanceof(Array).and.have.lengthOf(1);

        result = utils.processArgs(eval(arg_fileName_good_3)[0]);
        result.states.should.be.instanceof(Array).and.have.lengthOf(2);

        result = utils.processArgs(eval(arg_fileName_good_4)[0]);
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

    //     var result = utils.processArgs(eval(arg_fileName_bad_1)[0]);
    //     result.filename.should.eql('index.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     result = utils.processArgs(eval(arg_fileName_bad_2)[0]);
    //     result.filename.should.eql('index.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     result = utils.processArgs(eval(arg_fileName_bad_3)[0]);
    //     result.filename.should.eql('index.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     result = utils.processArgs(eval(arg_fileName_bad_4)[0]);
    //     result.filename.should.eql('test.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     done();
    // });

    // it('should return provided fileName when a bad value and then a good value are provided on cli', function(done) {

    //     var arg_fileName_bad_4 = "[{ '0': '-filename', '1': '-filename=test.html' }]";
    //     var arg_fileName_bad_5 = "[{ '0': '-filename=', '1': '-filename=test.html' }]";
    //     var arg_fileName_bad_6 = "[{ '0': '-filenameindex.html', '1': '-filename=test.html' }]";

    //     var result = utils.processArgs(eval(arg_fileName_bad_4)[0]);
    //     result.filename.should.eql('test.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     result = utils.processArgs(eval(arg_fileName_bad_5)[0]);
    //     result.filename.should.eql('test.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     result = utils.processArgs(eval(arg_fileName_bad_6)[0]);
    //     result.filename.should.eql('test.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))
    //     done();
    // });

    // it('should return provided fileName when a good value and then a bad value are provided on cli', function(done) {

    //     var arg_fileName_bad_4 = "[{'0': '-filename=test.html', '1': '-filename' }]";
    //     var arg_fileName_bad_5 = "[{'0': '-filename=test.html', '1': '-filename=' }]";
    //     var arg_fileName_bad_6 = "[{'0': '-filename=test.html', '1': '-filenameindex.html' }]";

    //     var result = utils.processArgs(eval(arg_fileName_bad_4)[0]);
    //     result.filename.should.eql('test.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     result = utils.processArgs(eval(arg_fileName_bad_5)[0]);
    //     result.filename.should.eql('test.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))

    //     result = utils.processArgs(eval(arg_fileName_bad_6)[0]);
    //     result.filename.should.eql('test.html');
    //     result.filepath.should.eql(path.resolve(__dirname + "/../../../" + CONFIG.STORAGE))
    //     done();
    // });
});
