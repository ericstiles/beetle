/*jslint node: true */
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
/**
 * Copied outline from underscore implementation.
 * @return {Object} Implementation that contains functionality manage craigslist searches
 */
(function() {
    var root = this;
    // Create a safe reference to the utils object for use below.
    var Utils = function(obj) {
        if (obj instanceof Utils) return obj;
        if (!(this instanceof Utils)) return new Utils(obj);
        this.utilswrapped = obj;
    };

    // Export the craigslist object for **Node.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `_` as a global object.
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = Utils;
        }
        // exports._ = cl;
    } else {
        root.Utils = Utils;
    }
    /**
     * Give any type of url break into the host and path and return ithem.
     * @param  {String} String - url to be split
     * @return {Object} Object literal with two properties: url, path
     */
    Utils.parsePathName = function(string) {
        var reg = /.+?\:\/\/.+?(\/.+?)(?:#|\?|$)/;
        var pathname = reg.exec(string);
        if (_.isNull(pathname)) return null;
        return pathname[1];
    };
    /**
     * Given a a url path the domain minus http(s) protocol is returned
     * @param  {String} URL - or URI
     * @return {String}     domain without http(s)
     */
    Utils.parseHostName = function(url) {
        if (_.isUndefined(url) || _.isNull(url) || url.length === 0) return '';
        else if (url.search(/^https?\:\/\//) !== -1)
            url = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i, "");
        else
            url = url.match(/^([^\/?#]+)(?:[\/?#]|$)/i, "");
        return url[1];
    };
    /**
     * Promise wrapper for HTTP requests.
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    Utils.getHTTPRequest = function(options) {
        var deferred = Q.defer();
        return http.request(options);
    };
    /**
     * [formatDate description]
     * @param  {[type]} options
     * @return {[type]}
     */
    Utils.formatDate = function(options) {
        return moment(options.date, options.format).format(options.parse);
    };
    /**
     * Clean up string to make suitable link
     * @param  {[type]} string [description]
     * @return {[type]}        [description]
     */
    Utils.linkify = function(string) {
        return encodeURIComponent(string.toLowerCase());
    };
    /*
     * Asynchronous wrapper that writes String object to file.  Does not append, but overwrites file
     * @param  {String}   filePath location of file that should be written
     * @param  {String}   contents String that should be written
     * @param  {Function} callback Function to call on completion
     */
    Utils.writeFile = function(options) {
        //CHECK OPTIONS
        var deferred = Q.defer();
        fse.ensureFile(options.filepath, function(error) {
            if (error) {
                error.message = "Error confirming html file exists:" + error.message;
                throw error;
            } else {
                fse.writeFile(options.filepath, options.contents, function(error, data) {
                    if (error) deferred.reject(error); // rejects the promise with `er` as the reason
                    else deferred.resolve(data); // fulfills the promise with `data` as the value
                });
            }
        });
        return deferred.promise; // the promise is returned
    };
    /**
     * Add your own custom functions to this object.
     * @param  {[type]} obj [description]
     * @return {[type]}     [description]
     */
    Utils.mixin = function(obj) {
        _.each(_.functions(obj), function(name) {
            var func = Utils[name] = obj[name];
            Utils.prototype[name] = function() {
                var args = [this._wrapped];
                this.push.apply(args, arguments);
                return this.result(this, func.apply(Utils, args));
            };
        });
    };
    // Add all of the Underscore functions to the wrapper object.
    Utils.mixin(Utils);

    // Extracts the result from a wrapped and chained object.
    Utils.prototype.value = function() {
        return this.utilswrapped;
    };
    // AMD registration happens at the end for compatibility with AMD loaders
    // that may not enforce next-turn semantics on modules. Even though general
    // practice for AMD registration is to be anonymous, underscore registers
    // as a named module because, like jQuery, it is a base library that is
    // popular enough to be bundled in a third party lib, but not be part of
    // an AMD load request. Those cases could generate an error when an
    // anonymous define() is called outside of a loader request.
    if (typeof define === 'function' && this.define.amd) {
        this.define('index', [], function() {
            return Utils;
        });
    }

}.call(this));
