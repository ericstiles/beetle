'use strict';

var http = require('q-io/http'),
    _ = require('underscore'),
    xpath = require('xpath.js'),
    path = require('path'),
    select = require('xpath.js'),
    dom = require('xmldom').DOMParser,
    CONFIG = require('config'),
    moment = require('moment'),
    utils = require('../utils/index.js'),
    Q = require('q');
// ,logger = require('./lib/logger.js')(process.env.LOG_LEVEL);

/**
 * Curried function to used to enable logging as needed.  Uses configuration to turn on or off.
 * @param  {String} preMessage - logging pre message in front of console message.
 * @return {Function}            Function for pushing logging messages to console.
 */
var curnsole = function(preMessage) {
    return function(message) {
        if (CONFIG.ENABLE_LOG === true) console.log(preMessage + ":" + message);
    }
}

/**
 * Options sent to dom parser
 * @type {Object}
 */
var domOptions = {
    errorHandler: {
        warning: curnsole("WARNING"),
        error: curnsole("ERROR"),
        fatalError: curnsole("FATAL ERROR")
    }
};

/**
 * Copied outline from underscore implementation.
 * @return {Object} Implementation that contains functionality manage craigslist searches
 */
(function() {
    var root = this;
    // Create a safe reference to the craigslist object for use below.
    var cl = function(obj) {
        if (obj instanceof cl) return obj;
        if (!(this instanceof cl)) return new cl(obj);
        this.clwrapped = obj;
    };

    // Export the craigslist object for **Node.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `_` as a global object.
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = cl;
        }
        // exports._ = cl;
    } else {
        root.cl = cl;
    }
    /**
     * Given a predicate function that returns a boolean value for filtering search results.  Uses underscore filter function.
     * @param  {Object} options Object literal containing array key to list of ad results that need to be filtered and predicate key to filter function.
     * @return {Array}         Filtered array resultset
     */
    cl.filterDomains = function(options, error) {
        //CONFIRM OPTIONS IS CORRECT
        try {
            return _.filter(options.array, options.predicate);
        } catch (err) {
            throw err;
        }
    }
    /**
     * Process command line arguments to set up the options that this application
     * uses.  Arguments are in through a standard object literal.  If the same parameter
     * is entered twice only the first entry is recognized.
     *
     * Available files are listed below:
     *
     * filename: name of file that will results will be saved as.  Default is index.html
     * filepath: coming soon
     * searchstring: coming soon
     * states: coming soon
     * cities: coming soon
     * date: coming soon
     *
     * @param  {Object} options - cli input that needs to be parsed
     * @return {Object}           options to drive configuration of the application.
     */
    cl.processArgs = function(options) {
        //Options that the application can use
        var OPTIONS = ['filename', 'filepath', 'states', 'cities', 'date', 'searchstring'],
            returnOptions = {},
            args = _.values(options);
        _.each(OPTIONS, function(optElement, index) {
            var fileNameArray = _.filter(args, function(element) {
                return element.indexOf('-' + optElement + '=') >= 0 && element.length > ('-' + optElement + '=').length;
            });
            returnOptions[optElement] = fileNameArray.length > 0 ?
                fileNameArray[0].slice(fileNameArray[0].indexOf("=") + 1) :
                CONFIG[optElement.toUpperCase()];

        });
        //set filepath for filename
        returnOptions.filepath = path.resolve(__dirname + "/../../../" + CONFIG.STORAGE);

        //Converts string in states value to array.
        if (_.isString(returnOptions.states)) {
            returnOptions.states = returnOptions.states.split(",");
        }
        //Converts string in cities value to array.
        if (_.isString(returnOptions.cities)) {
            returnOptions.cities = returnOptions.cities.split(",");
        }
        //Sets date for filtering
        if (_.isString(returnOptions.date)) {
            returnOptions.date = returnOptions.date.split("-");
            returnOptions.date[1] = returnOptions.date[1] - 1;
            returnOptions.date = moment(returnOptions.date).format();
        } else {
            returnOptions.date = moment(moment().toArray().slice(0,3)).format();
        }
        return returnOptions;
    };
    /**
     * Response function from HTTP request to parse craigslist sites html page
     * and write to file.
     * @param  {Function} response Function to call on http response
     */
    cl.parseSitesHTML = function(response) {
        if (response.status === 200 || response.status === 301 || response.status === 302) {
            return response.body.read().then(
                function(success, error) {
                    if (error) {
                        throw (error);
                    }
                    var allCitySites = [];
                    try {
                        var doc2 = new dom(domOptions).parseFromString(success.toString("utf-8"));
                        //Pull all header sections such as Georgia, Texas.
                        var allStateNodes = select(doc2, "//h4");
                        _.each(allStateNodes, function(eachStateNode) {
                            var allCityNodes = select(eachStateNode.nextSibling.nextSibling, './/li/a');
                            var counter = 1;
                            _.each(allCityNodes, function(eachCityNode) {
                                allCitySites.push({
                                    title: eachCityNode.firstChild.data,
                                    host: eachCityNode.getAttribute('href'),
                                    state: eachStateNode.firstChild.data
                                });
                            });
                        })
                    } catch (error) {
                        throw error;
                    }
                    return allCitySites;
                },
                function(error) {
                    throw error;
                });
        }
    }
    /**
     * Given an object literal containing options for an http get request get the first page of ads returned.
     * @param  {Object} cityDomain Options to make a GET request
     * @return {String}             HTML page of ads
     */
    cl.getAdPagesFromSingleCityDomain = function(cityDomain) {
        return utils.getHTTPRequest({
                hostname: utils.parseHostName(cityDomain[0].host),
                path: CONFIG.URI_PATH,
                method: 'GET'
            })
            .then(
                function(success, error) {
                    return success.body.read();
                },
                function(error) {
                    throw error;
                })
            .then(
                function(body) {
                    return body.toString("utf-8");
                },
                function(error) {});
    }
    /**
     * Given an array of object literals containing options for an http get request get the first page of ads returned.
     * Uses Promises.
     * @param  {Object} cityDomains Options to make a GET request
     * @return {String}             Array of HTML page of ads
     */
    cl.getAdPagesFromCityDomains = function(cityDomains) {
        var htmlArray = [];
        return Q.allSettled(
            _.map(cityDomains, function(element, index) {
                return utils.getHTTPRequest({
                        hostname: utils.parseHostName(element.host),
                        path: CONFIG.URI_PATH
                    })
                    .then(
                        function(success, error) {
                            return success.body.read();
                        },
                        function(error) {
                            error.message = "Error getting URL: " + utils.parseHostName(element.host) + " & " + CONFIG.URI_PATH + ".  " + error.message;
                            throw error;
                        })
                    .then(
                        function(body, error) {
                            element.html = body.toString("utf-8");
                            return element;
                        },
                        function(error) {
                            throw error;
                        });
            })
        )
    }
    /**
     * Given an array HTML Pages containing ads parse those pages and return a single array of ads
     * @param  {Arrat} htmlArray - Array of html pages that need to be parsed
     * @return {[type]} Array of ad information as a JSON Object
     */
    cl.parseAdsFromHTMLArray = function(htmlArray) {
        return Q.allSettled(
                _.map(htmlArray, function(node) {
                    var ads = [];
                    var ad = {};
                    var nodeLocation;
                    var doc2 = new dom(domOptions).parseFromString(node.html, "text/html");
                    try {
                        nodeLocation = select(doc2, "//a[@href='/']")[0].firstChild.data;
                    } catch (err) {
                        nodeLocation = "ERROR-GETTING-LOCATION";
                    }
                    ad.domainLocation = nodeLocation.toString();
                    ad.domain = node.host;
                    ad.state = node.state;
                    var nodes2 = select(doc2, "//div[@class=\"content\"]/p", "text/html");
                    _.each(nodes2, function(innerNode, index) {
                        ads.push(cl.parseListingPNode(innerNode, {
                            domain: ad.domain,
                            city: ad.domainLocation,
                            state: ad.state
                        }));
                    });
                    return ads;
                })
            )
            .then(function(results, error) {
                if (error) {
                    throw error;
                }
                //NEED TO FILTER ON 'fulfilled' and capture if not all fulfilled
                return _.flatten(_.pluck(results, 'value'));
            });
    }
    /**
     * [parseListingPNode description]
     * @param  {Object} node - Dom node that can be parsed
     * @return {Object}      JSON object of parsed ad
     */
    cl.parseListingPNode = function(node, additionalProperties) {
        var tmpListing = {}
        _.each(_.keys(additionalProperties), function(element, index) {
            tmpListing[element] = additionalProperties[element];
        });
        try {
            tmpListing.href = node.childNodes[1].getAttribute('href');
        } catch (err) {
            tmpListing.href = "'href' couldn't be parsed";
        }
        try {
            tmpListing.dataid = node.childNodes[1].getAttribute('data-id');
        } catch (err) {
            tmpListing.dataid = "'dataid' couldn't be parsed";
        }
        try {
            tmpListing.price = node.childNodes[1].childNodes[0].childNodes[0].toString();
        } catch (err) {
            tmpListing.price = "'price' couldn't be parsed";
        }
        try {
            tmpListing.date = select(node, ".//span[@class='date']")[0].firstChild.data;
            tmpListing.date = moment(tmpListing.date, 'MMM DD').format();
        } catch (err) {
            tmpListing.date = "'date' couldn't be parsed";
        }
        try {
            var dataNode = select(node, ".//a[@class='hdrlnk'] ");
            tmpListing.title = dataNode[0].firstChild.data;
        } catch (err) {
            tmpListing.title = "'title' couldn't be parsed";
        }
        try {
            var textNode = select(node, ".//span[@class='pnr']/small");
            tmpListing.location = (textNode.length === 0 ? '' : textNode[0].firstChild.data);
        } catch (err) {
            tmpListing.location = "'location' couldn't be parsed";
        }
        try {
            var picNode = select(node, ".//span[@class='pnr']/span/span[@class='p']");
            tmpListing.picture = (picNode.length === 0 ? '' : picNode[0].firstChild.data);
        } catch (err) {
            tmpListing.picture = "'picture' couldn't be parsed";
        }
        try {
            var mapNode = select(node, ".//span[@class='maptag']");
            tmpListing.map = (mapNode.length === 0 ? '' : mapNode[0].firstChild.data);
        } catch (err) {
            tmpListing.map = "'map' couldn't be parsed";
        }
        return tmpListing;
    };
    /**
     * Given a set of inputs an existing set of ads are filtered on those inputs
     *     date - Currently on filter on ads is to return all ads submitted on or after the provided date
     * @param  {Object} input - Object literal containing filter properties and array
     * @return {Array}         Array of ads meeting filter criteria
     */
    cl.filterAds = function(input) {
        return _.filter(input.ads, function(element) {
            return !(moment(input.filter.date).isAfter(moment(element.date)));
        });
    }
    /**
     * Clean up string to make suitable link
     * @param  {[type]} string [description]
     * @return {[type]}        [description]
     */
    cl.linkify = function(string) {
        return encodeURIComponent(string.toLowerCase());
    }
    /**
     * [writeEachStateHTMLPage2 description]
     * @param  {[type]} state [description]
     * @param  {[type]} obj   [description]
     * @return {[type]}       [description]
     */
    cl.writeHTMLPage2 = function(adArray) {
        console.log("Writing HTML For " + adArray.length + " Ads.");
        var htmlPage = '';
        htmlPage += '<!DOCTYPE html><html><head>';
        htmlPage += '<script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>';
        htmlPage += '<script src="http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"></script>';
        htmlPage += '<link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/bootswatch/3.2.0/united/bootstrap.min.css">';
        htmlPage += '<style>';
        htmlPage += '.back-to-top2{ position:fixed; top:2%; right:2%; }';
        htmlPage += '</style>';
        htmlPage += '</head><body><div class="container">';
        htmlPage += 'Page created on: ' + cl.creationDate() + '<br><br><hr><br><br>';
        htmlPage += cl.topMenu(adArray);
        var colOrder = [
            {
                id: 'i',
                class: 'col-md-1 col-lg-1'
            }, {
                id: 'a',
                class: 'col-md-4 col-lg-4'
            }, {
                id: 'price',
                class: 'col-md-1 col-lg-1'
            }, {
                id: 'location',
                class: 'col-md-2 col-lg-2'
            }, {
                id: 'city',
                class: 'col-md-1 col-lg-1'
            }, {
                id: 'date',
                class: 'col-md-1 col-lg-1'
            }, {
                id: 'picture',
                class: 'col-md-1 col-lg-1'
            }, {
                id: 'map',
                class: 'col-md-1 col-lg-1'
            }

        ];
        _.each(_.uniq(_.pluck(adArray, 'state')), function(state, index) {
            htmlPage += '<h1><a name=\'' + cl.linkify(state) + '\'>' + state + '</a></h1>';
            _.each(_.uniq(_.pluck(_.where(adArray, {
                state: state
            }), 'city')), function(city, index) {
                htmlPage += '<h2><a name=\'' + cl.linkify(city) + '\'>' + city + '</a></h2>';
                // htmlPage += '<table border="1">';
                // htmlPage += '<div class="row">';
                _.each(_.where(adArray, {
                        city: city
                    }),
                    function(ad, index) {
                        // htmlPage += '<tr>';
                        htmlPage += '<div class=\'row\'>';
                        var i;
                        if (_.isUndefined(ad.dataid) || _.isNull(ad.dataid) || ad.dataid.length === 0) {
                            i = '<img alt=\'\' src=\'http://www.craigslist.org/images/peace-sm.jpg\'>';
                        } else {
                            i = '<img alt=\'\' src=\'http://images.craigslist.org/' + ad.dataid.split(':')[1] + '_50x50c.jpg\'>';
                        }
                        var href = ad.href.slice(0, 4) === 'http' ? ad.href : ad.domain + ad.href;
                        var a = '<a href=\'' + href + '\'>' + ad.title + '</a>';
                        ad['a'] = a;
                        ad['i'] = i;

                       htmlPage += '<div class=\'' + colOrder[5].class + '\'>' + moment(ad[colOrder[5].id]).format('MMM Do') + '</div>';
                        htmlPage += '<div class=\'' + colOrder[0].class + '\'>' + ad[colOrder[0].id] + '</div>';
                        htmlPage += '<div class=\'' + colOrder[2].class + '\'>' + ad[colOrder[2].id] + '</div>';
                        htmlPage += '<div class=\'col-md-9 col-lg-9\'>';
                        htmlPage += '<div class=\'' + colOrder[1].class + '\'>' + ad[colOrder[1].id] + '</div>';
                        htmlPage += '<div class=\'' + colOrder[3].class + '\'>' + ad[colOrder[3].id] + '</div>';
                        htmlPage += '<div class=\'' + colOrder[4].class + '\'>' + ad[colOrder[4].id] + '</div>';
                        
                        htmlPage += '<div class=\'' + colOrder[6].class + '\'>' + ad[colOrder[6].id] + '</div>';
                        htmlPage += '<div class=\'' + colOrder[7].class + '\'>' + ad[colOrder[7].id] + '</div>';
                        htmlPage += '</div>';
                        // _.each(colOrder, function(element, index) {
                        //     // htmlPage += '<td>'
                        //     htmlPage += '<div class=\'' + element.class + '\'>';
                        //     htmlPage += ad[element.id];
                        //     // htmlPage += '</td>'
                        //     htmlPage += '</div>';
                        // });
                        // htmlPage += '</tr>'
                        htmlPage += '</div>';
                    });
                // htmlPage += '</table>'
                // htmlPage += '</div>';
            });
        });
        htmlPage += '<a href="#" class="back-to-top2">Back to Top</a>';
        htmlPage += '</div></body></html>';
        return htmlPage;
    }
    /**
     * [topMenu description]
     * @param  {[type]} adArray [description]
     * @return {[type]}         [description]
     */
    cl.topMenu = function(adArray) {
        var htmlPage = '';
        _.each(_.uniq(_.pluck(adArray, 'state')), function(state, index) {
            htmlPage += '<a href=\'#' + cl.linkify(state) + '\'>' + state + '&nbsp;</a>'
        });
        return htmlPage;
    }
    /**
     * [creationDate description]
     * @return {[type]} [description]
     */
    cl.creationDate = function() {
        var htmlPage = '';
        var now = moment().format('YYYY-MM-DD hh:mm A');
        htmlPage += now;
        return htmlPage;
    }
    /**
     * Add your own custom functions to this object.
     * @param  {[type]} obj [description]
     * @return {[type]}     [description]
     */
    cl.mixin = function(obj) {
        _.each(_.functions(obj), function(name) {
            var func = cl[name] = obj[name];
            cl.prototype[name] = function() {
                var args = [this._wrapped];
                push.apply(args, arguments);
                return result(this, func.apply(cl, args));
            };
        });
    };
    // Add all of the Underscore functions to the wrapper object.
    cl.mixin(cl);

    // Extracts the result from a wrapped and chained object.
    cl.prototype.value = function() {
        return this.clwrapped;
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
