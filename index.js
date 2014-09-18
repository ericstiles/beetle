'use strict';
var _ = require('underscore'),
    CONFIG = require('config'),
    path = require('path'),
    fse = require('fs-extra'),
    Q = require('q'),
    _ = require('underscore'),
    cl = require('./server/components/craigslist/index.js');

// Arguments
// - search string
// - filename (done)
// - filePath
// - states and/or cities

var processArgs = function(string) {
    var args = JSON.parse(process.argv[process.argv.length - 1]);
    var args2 = _.values(args);
    var fileNameArray = _.filter(args, function(element) {
        return element.indexOf('-filename') != 1;
    });
    var fileName = fileNameArray.length > 0 ?
        fileNameArray[0].slice(fileNameArray[0].indexOf("=") + 1) :
        CONFIG.HTML_FILE;
    return {
        fileName: fileName,
        filePath: path.resolve(__dirname + "/" + CONFIG.STORAGE)
    };

};

var programOptions = processArgs(process.argv[process.argv.length - 1]);

console.log(programOptions);

// process.exit(0);

var options = {
    hostname: cl.parseHostName(CONFIG.URL_SITES),
    path: cl.parsePathName(CONFIG.URL_SITES),
    method: 'GET'
};
var filterOptions = {
    array: [],
    predicate: function(value) {
        // var test = ['Texas', 'Louisiana', 'California', 'Arizona', 'New Mexico', 'Arkansas', 'Georgia', 'Oklahoma', 'Kansas', 'Nebraska', 'Alabama', 'Montana'];
        var test = ['Texas'];

        // return value.title === 'dothan' || value.title === 'auburn';
        return _.contains(test, value.state);
    },
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
            cl.writeFile({
                filepath: path.resolve(programOptions.filePath, programOptions.fileName),
                contents: success
            })
                .then(function(success, error) {
                    console.log(success);
                    console.log(error);
                    if (error) {
                        throw (error);
                    }
                    console.log('file location:' + path.resolve(programOptions.filePath, programOptions.fileName));
                    return "success";
                });
        },
        function(error) {
            throw error;
        });
