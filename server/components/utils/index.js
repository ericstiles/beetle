'use strict';

var http = require('q-io/http'),
    _ = require('underscore'),
    xpath = require('xpath.js'),
    fse = require('fs-extra'),
    path = require('path'),
    select = require('xpath.js'),
    dom = require('xmldom').DOMParser,
    CONFIG = require('config'),
    moment = require('moment'),
    Q = require('q');
// ,logger = require('./lib/logger.js')(process.env.LOG_LEVEL);

/**
 * Copied outline from underscore implementation.
 * @return {Object} Implementation that contains functionality manage craigslist searches
 */
(function() {
    var root = this;
    // Create a safe reference to the craigslist object for use below.
    var utils = function(obj) {
        if (obj instanceof utils) return obj;
        if (!(this instanceof utils)) return new utils(obj);
        this.utilswrapped = obj;
    };

    // Export the craigslist object for **Node.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `_` as a global object.
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = utils;
        }
        // exports._ = cl;
    } else {
        root.utils = utils;
    }
    /**
     * Give any type of url break into the host and path and return ithem.
     * @param  {String} String - url to be split
     * @return {Object} Object literal with two properties: url, path
     */
    utils.parsePathName = function(string) {
        var reg = /.+?\:\/\/.+?(\/.+?)(?:#|\?|$)/;
        var pathname = reg.exec(string);
        if (_.isNull(pathname)) return null;
        return pathname[1];
    }
    /**
     * Given a a url path the domain minus http(s) protocol is returned
     * @param  {String} URL - or URI
     * @return {String}     domain without http(s)
     */
    utils.parseHostName = function(url) {
        if (_.isUndefined(url)) return undefined;
        if (_.isNull(url)) return null;
        if (url.length === 0) return '';
        if (url.search(/^https?\:\/\//) != -1)
            url = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i, "");
        else
            url = url.match(/^([^\/?#]+)(?:[\/?#]|$)/i, "");
        return url[1];
    }
    /**
     * Promise wrapper for HTTP requests.
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    utils.getHTTPRequest = function(options) {
        var deferred = Q.defer();
        return http.request(options);
    }
    /**
     * [writeJSON description]
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    utils.writeJSON = function(options) {
        //CHECK OPTIONS
        var deferred = Q.defer();
        Q.nfcall(fse.ensureFile, options.filepath)
            .then(fse.writeJSON(options.filepath, options.contents, deferred.resolve(options.filepath)));
        return deferred.promise;
    }
    /*
     * Asynchronous wrapper that writes String object to file.  Does not append, but overwrites file
     * @param  {String}   filePath location of file that should be written
     * @param  {String}   contents String that should be written
     * @param  {Function} callback Function to call on completion
     */
    utils.writeFile = function(options) {
        //CHECK OPTIONS
        var deferred = Q.defer()
        fse.ensureFile(options.filepath, function(error) {
            if (error) {
                error.message = "Error confirming html file exists:" + error.message;
                throw error;
            } else {
                fse.writeFile(options.filepath, options.contents, function(error, data) {
                    if (error) deferred.reject(error) // rejects the promise with `er` as the reason
                    else deferred.resolve(data) // fulfills the promise with `data` as the value
                })
            }
        });
        return deferred.promise // the promise is returned
    }
    /**
     * Clean up string to make suitable link
     * @param  {[type]} string [description]
     * @return {[type]}        [description]
     */
    utils.linkify = function(string) {
        return encodeURIComponent(string.toLowerCase());
    }
    /**
     * Add your own custom functions to this object.
     * @param  {[type]} obj [description]
     * @return {[type]}     [description]
     */
    utils.mixin = function(obj) {
        _.each(_.functions(obj), function(name) {
            var func = utils[name] = obj[name];
            utils.prototype[name] = function() {
                var args = [this._wrapped];
                push.apply(args, arguments);
                return result(this, func.apply(utils, args));
            };
        });
    };
    // Add all of the Underscore functions to the wrapper object.
    utils.mixin(utils);

    // Extracts the result from a wrapped and chained object.
    utils.prototype.value = function() {
        return this.utilswrapped;
    };
    // AMD registration happens at the end for compatibility with AMD loaders
    // that may not enforce next-turn semantics on modules. Even though general
    // practice for AMD registration is to be anonymous, underscore registers
    // as a named module because, like jQuery, it is a base library that is
    // popular enough to be bundled in a third party lib, but not be part of
    // an AMD load request. Those cases could generate an error when an
    // anonymous define() is called outside of a loader request.
    if (typeof define === 'function' && define.amd) {
        define('index', [], function() {
            return cl;
        });
    }

}.call(this));
