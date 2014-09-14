'use strict';
var _ = require('underscore'),
    CONFIG = require('config'),
    path = require('path'),
    fse = require('fs-extra'),
    Q = require('q'),
    _ = require('underscore'),
    cl = require('./server/components/craigslist/index.js');

var options = {
    hostname: cl.parseHostName(CONFIG.URL_SITES),
    path: cl.parsePathName(CONFIG.URL_SITES),
    method: 'GET'
};
var filterOptions = {
    array: [],
    predicate: function(value) {
        var test = ['Texas', 'Louisiana', 'California', 'Arizona', 'New Mexico'];
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
            cl.writeFile({
                filepath: path.resolve(__dirname + "/" + CONFIG.STORAGE, CONFIG.HTML_FILE),
                contents: success
            })
                .then(function(success, error) {
                    if (error) {
                        throw(error);
                    }
                    return "success";
                });
        },
        function(error) {
            throw error;
        });
