goog.provide('helpim.start');

goog.require('goog.debug.DivConsole');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('goog.debug.LogManager');

goog.require('xmpptk.Config');

goog.require('helpim.Client');

/**
 * @param {xmpptk.Config} cfg a configuration 
 */
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