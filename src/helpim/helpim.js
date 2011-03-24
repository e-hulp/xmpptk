goog.provide('helpim.start');

goog.require('goog.debug.Console');
goog.require('goog.object');

goog.require('xmpptk.Config');

goog.require('helpim.Client');

helpim.start = function(cfg) {
    if (goog.DEBUG) {
        new goog.debug.Console().setCapturing(true);
    }
    goog.object.extend(xmpptk.Config, cfg);
    helpim.Client.getInstance();
};

goog.exportSymbol('helpim.start', helpim.start);