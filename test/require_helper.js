'use strict';
var path = require('path');
module.exports = function(modulepath) {
    path.normalize((process.env.APP_DIR_FOR_CODE_COVERAGE || '../') + modulepath);
    return require((process.env.APP_DIR_FOR_CODE_COVERAGE || '../') + modulepath);
};
