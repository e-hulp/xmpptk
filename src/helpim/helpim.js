goog.provide('helpim.start');

goog.require('goog.debug.DivConsole');
goog.require('goog.object');

goog.require('xmpptk.Config');

goog.require('helpim.Client');

helpim.start = function(cfg) {
    if (goog.DEBUG) {
        goog.debug.LogManager.getRoot().setLevel(goog.debug.Logger.Level.ALL);
        var logger = goog.debug.Logger.getLogger('helpim');
        var logconsole = new goog.debug.DivConsole(goog.dom.getElement('log'));
        logconsole.setCapturing(true);
    }
    goog.object.extend(xmpptk.Config, cfg);
    helpim.Client.getInstance();
};

goog.exportSymbol('helpim.start', helpim.start);