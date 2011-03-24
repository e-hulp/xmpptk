goog.provide('helpim.start');

goog.require('xmpptk.Config');
goog.require('helpim.Client');
goog.require('goog.debug.Console');

helpim.start = function() {
    if (goog.DEBUG) {
        new goog.debug.Console().setCapturing(true);
    }
    new helpim.Client(new xmpptk.Config(HELPIM_CONFIG));
};

goog.exportSymbol('helpim.start', helpim.start);