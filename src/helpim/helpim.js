goog.provide('helpim');

goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('goog.debug.LogManager');
goog.require('goog.debug.Console');

goog.require('xmpptk.Config');

goog.require('helpim.Client');

/**
 * @param {xmpptk.Config} cfg a configuration 
 */
helpim.start = function(cfg) {
    if (cfg.debug) {
        var log_level = goog.debug.Logger.Level.ALL;
        if (goog.isString(cfg.log_level) && goog.debug.Logger.Level[cfg.log_level.toUpperCase()]) {
            log_level = goog.debug.Logger.Level[cfg.log_level.toUpperCase()];
        }
        goog.debug.LogManager.getRoot().setLevel(log_level);
        var logger = goog.debug.Logger.getLogger('helpim');
        var logconsole = new goog.debug.Console();
        logconsole.setCapturing(true);
    }
    goog.object.extend(xmpptk.Config, cfg);
    helpim.Client.getInstance();
};
goog.exportSymbol('helpim.start', helpim.start);