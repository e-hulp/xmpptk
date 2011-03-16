goog.provide('helpim.Config');

/**
 * @constructor
 */
helpim.Config = function(obj) {
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            this[i] = obj[i];
        }
    }

    // set some reasonable defaults
    this.httpbase = obj.httpbase || '/http-bind/';
    this.xmppdomain = obj.xmppdomain || 'localhost';
    this.resource = obj.resource || 'helpim';

};
