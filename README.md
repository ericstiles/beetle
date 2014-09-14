beetle
======
##What is it?
A tool to aggregate automotive craigslist searches from multiple locations into a single html page view.
##How do I install it?
This project is not in the NPM respository
* download a copy of the code
* *cd* to the beetle folder
* run 
```
npm install
```
##How do I run it?
```
grunt update
```
When completed open file
```
./storage/index.html
```
##How do I modify it for my use?
Look at *./config/default.js* for the property URI_SEARCH_PATH.  This is a craigslist uri path with a standard set of search parameters.  Modify these as needed.

The default search path is
```
/search/cto?query=beetle&minAsk=50&maxAsk=1000&autoMinYear=1950&autoMaxYear=1980
```

Look at *./index.js* for a PREDICATE validation function to determine how results to group together.  Results can be grouped by domain, city, or State as seen on the http://craigslist.com/about/sites html page.  

The default validation function is
```js
function(value) {
    var test = ['Texas', 'Louisiana', 'California', 'Arizona'];
    return _.contains(test, value.state);
},
```

###Example Predicates
Grouping on cities
```js
function(value) {
    return value.title === 'dothan' || value.title === 'auburn';
},
```
Searching on a single domain
```js
function(value) {
    return value.domain === 'chicago.craigslist.org';
},
```
###WARNING
Aggregating a large number ads from many different domains will cause performance issues.  Pulling ads from three different domains generally takes about 8 seconds.
##How does it work?
Promises...

In *./index.js* Promises are chained using **then** where the following functions are run

1. **getHTTPRequest**:get html sites page and return it
2. **parseSitesHTML**:parse html sites page and return array of domains including state of city domain
3. **filterDomains**:filter domains and return array of desired domains
4. **getAdPagesFromCityDomains**:get html page for each domain and return an array of html pages
5. **parseAdsFromHTMLArray**:parse each html page for ads and return an array of array of city ads
6. **writeHTMLPage2**:write to html file all ads

Underscore is heavily as a utility for working on arrays that are passed in.

The parameters that the application looks for in an ad are
* href ad link
* data-id
* price
* date
* title
* pic
* map
#Testing
```js
grunt test:server
```
#Various
Note that there is extra stuff in the project.  This project started life using the yeoman fullstack generator.  The extraneous code hasn't been pulled out yet.
#Next Steps
I need to 
* add better error handling
* add a few more unit tests

I want to
* make the chaining more dynamic
* push results to a database or someother store
* write a front-end UI to this tool making it more user friendly
