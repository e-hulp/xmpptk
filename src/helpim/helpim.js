goog.provide('helpim');

goog.require('goog.object');

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

helpim.registeredHandlers_ = {};

/**
 * calls registered handler(s) for an event
 * @param {string} event the event to call
 * @param {?object} params optional arguments to pass to handlers for event
 */
helpim.call = function(event, params){
	goog.object.forEach(
		helpim.registeredHandlers_[event],
		function(handler) {
			handler(params);
		}
	);
};

/**
 * register handler for an event
 * @param {string} event the event to register handler for
 * @param {function(*)} handler the handler to register with event
 */
helpim.register = function(event, handler) {
	if (!helpim.registeredHandlers_[event]) {
		helpim.registeredHandlers_[event] = [];
	}
	helpim.registeredHandlers_[event].push(handler);
};

goog.exportSymbol('helpim.start', helpim.start);
goog.exportSymbol('helpim.call', helpim.call);

/**
 * fill in what we need but isn't there
 */
if (typeof (Array.prototype.reduce) == 'undefined') {
    Array.prototype.reduce = function(fun, acc) {
        for (var i=0, l=this.length; i<l; i++) {
            if (this.hasOwnProperty(i)) { 
                acc += fun(acc, this[i]);
            }
        }
        return acc;
    };
};