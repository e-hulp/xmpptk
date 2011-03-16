goog.provide('helpim.Client');

goog.require('xmpptk.model');
goog.require('xmpptk.Client');

goog.require('goog.debug.Logger');

helpim.Client = function(cfg) {
    xmpptk.client.call(this);

    this._client = new xmpptk.Client(cfg);
};
goog.inherits(helpim.client, xmpptk.model);

/**
 * @protected
 * @type {goog.debug.Logger}
 */
helpim.Client.prototype.logger = goog.debug.Logger.getLogger('helpim.Client');