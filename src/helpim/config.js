goog.provide('helpim.Config');

/**
 * @constructor
 */
helpim.Config = function(obj) {
    // set some reasonable defaults
    this.httpbase = obj.httpbase || '/http-bind/';
    this.xmppdomain = obj.xmppdomain || 'localhost';
    this.resource = obj.resource || 'helpim';
};
