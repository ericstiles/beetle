'use strict';
var _ = require('underscore'),
    CONFIG = require('config'),
    path = require('path'),
    fse = require('fs-extra'),
    Q = require('q'),
    _ = require('underscore'),
    utils = require('./server/components/utils/index.js'),
    cl = require('./server/components/craigslist/index.js');

var programOptions = utils.processArgs(eval('[' + process.argv[process.argv.length - 1] + ']')[0]);

var options = {
    hostname: cl.parseHostName(CONFIG.URL_SITES),
    path: cl.parsePathName(CONFIG.URL_SITES),
    method: 'GET'
};
var filterOptions = {
    array: [],
    predicate: function(value) {
        return _.contains(programOptions.states, value.state) || _.contains(programOptions.cities, value.title);
    }
};

cl.getHTTPRequest(options)
    .then(cl.parseSitesHTML)
    .then(
        function(success, error) {
            filterOptions.array = success;
            return filterOptions;
        },
        function(error) {
            throw error;
        })
    .then(
        cl.filterDomains,
        function(error) {
            throw error;
        })
    .then(
        cl.getAdPagesFromCityDomains,
        function(error) {
            throw error;
        })
    .then(function(success, error) {
            return _.pluck(success, 'value');
        },
        function(error) {
            throw error;
        })
    .then(
        cl.parseAdsFromHTMLArray,
        function(error) {
            throw error;
        })
    .then(
        cl.writeHTMLPage2,
        function(error) {
            throw error;
        })
    .then(function(success, error) {
            //NOT A PROMISE.  NEEDS TO BE WRAPPED
            // console.log(success);
            utils.writeFile({
                filepath: path.resolve(programOptions.filepath, programOptions.filename),
                contents: success
            })
                .then(function(success, error) {
                    console.log(success);
                    console.log(error);
                    if (error) {
                        throw (error);
                    }
                    console.log('file location:' + path.resolve(programOptions.filepath, programOptions.filename));
                    return "success";
                });
        },
        function(error) {
            throw error;
        });
