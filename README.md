beetle
======
## What is it?
A tool to aggregate automotive craigslist searches from multiple locations into a single html page view.

**This tool is still under development and can experience major changes**

##How do I install it?
This project is not in the NPM respository
* download a copy of the code
* *cd* to the beetle folder
* run 
```
npm install
```
## How do I run it?
### Setting file where ads can be stored
```
grunt search:-filename=georgia-ads.html
```

### Setting filter based on states.
```
grunt search:-states=Texas,Georgia,Arkansas
```

###Setting filter based on cities
```
grunt search:-cities=mobile,dothan
```

### Setting filter based on date
```
grunt search:-date=2014-09-21
```

### Combining arguments
```
grunt search:-filename=ads.html:-states=Texas,California:-cities=mobile,dothan:-date=2014-09-21
```

### Warning
**States and Cities with spaces do yet work for filtering**

### When completed open file
```
./storage/<chosen file name>
```

## How do I modify it for my use?
Look at *./config/default.js* for the property URI_SEARCH_PATH.  This is a craigslist uri path with a standard set of search parameters.  Modify these as needed.

The default configuration is
```json
module.exports = {
    ROOT: './',
    STORAGE: 'storage',
    URL_SITES: 'http://www.craigslist.org/about/sites',
    URI_PATH: '/search/cto?query=beetle+-super&minAsk=50&maxAsk=10000&autoMinYear=1955&autoMaxYear=1975',
    FILENAME: 'index.html',
    ENABLE_LOG: false,
    STATES: ['Georgia'],
    CITIES: []
};
```

Notice the default search path in the above configuration is
```
/search/cto?query=beetle&minAsk=50&maxAsk=1000&autoMinYear=1950&autoMaxYear=1980
```

Another example to try is
```
/search/sss?query=welder&sort=rel
```

## How does the application filter results?
The application uses to filtering approaches based on the attributes that need to be filter
1. States and Cities to reduce the domains that are used to retrieve results
2. Filtering on results once all have been retrieved from the requested domains
    1. date is used in the second approach to remove all results that were not submitted on or after the date submitted 

The default validation function to filter domains on for search results is
```js
function(value) {
    return _.contains(programOptions.states, value.state) || 
           _.contains(programOptions.cities, value.title);
}
```

The following function demonstrates filtering ads on attribute values
```js
function(input) {
    return _.filter(input.ads, function(element) {
        return !(moment(input.filter.date).isAfter(moment(element.date)));
    });
}
```

### Warning
**States and Cities with spaces do yet work for filtering**

### Example Predicates
Example predicates searching on a single domain requires modifying the actual function
```js
function(value) {
    return value.domain === 'chicago.craigslist.org';
},
```
### WARNING
Aggregating a large number ads from many different domains will cause performance issues.  Pulling ads from three different domains generally takes about 8 seconds.

## How does it work?
Promises...

In *./index.js* Promises are chained using **then** where the following functions are run

1. **getHTTPRequest**:get html sites page and return it
2. **parseSitesHTML**:parse html sites page and return array of domains including state of city domain
3. **filterDomains**:filter domains and return array of desired domains
4. **getAdPagesFromCityDomains**:get html page for each domain and return an array of html pages
5. **parseAdsFromHTMLArray**:parse each html page for ads and return an array of array of city ads
6. **filterAds**:reduce resultset based on attribute values meeting criteria
7. **writeHTMLPage2**:write to html file all ads

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
Some opportunities here.  Tests are written for most of the code I wrote.  Missing tests for promises, and code from used from other developers.
```js
grunt test

grunt coverage
```

#Various
Note that there is extra stuff in the project.  This project started life using the yeoman fullstack generator.  The extraneous code hasn't been pulled out yet.
#Next Steps
I need to 
* add better error handling
* add a few more unit tests
* make everything a promise
* move functionality to utils/index.js file

I want to
* make the chaining more dynamic
* push results to a database or some gtother store
* write a front-end UI to this tool making it more user friendly
