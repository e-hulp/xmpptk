goog.provide('helpim.start');

goog.require('helpim.Client');

helpim.start = function() {
    new helpim.Client(new helpim.Config(HELPIM_CONFIG));
};

goog.exportSymbol('helpim.start', helpim.start);