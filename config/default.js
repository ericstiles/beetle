  'use strict';
  var path = require('path');
  /* 
   * Configuration Parameters
   */
  module.exports = {
      "ROOT": path.normalize(path.resolve(__dirname, "../")),
      "STORAGE": "./storage",
      "URL_SITES": "http://www.craigslist.org/about/sites",
      "URI_PATH": "/search/cto?query=beetle+-super&minAsk=50&maxAsk=10000&autoMinYear=1955&autoMaxYear=1975",
      // URI_PATH: '/search/sss?query=welder&sort=rel",
      "FILENAME": "index.html",
      "ENABLE_LOG": false,
      // STATES: ['Texas', 'Louisiana', 'California', 'Arizona', 'Nevada', 'Arkansas', 'Mississippi', 'Georgia', 'Florida'],
      "STATES": ["Georgia"],
      "CITIES": [],
      "DATE": []
  };
