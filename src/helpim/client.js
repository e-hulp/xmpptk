goog.provide('helpim.Client');

goog.require('xmpptk.Model');
goog.require('xmpptk.Config');
goog.require('xmpptk.Client');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.debug.Logger');

/**
 * @constructor
 * @extends {xmpptk.Model}
 * @param {xmpptk.Config} cfg A configuration
 */
helpim.Client = function(cfg) {
    this.logger.info("starting up");
    xmpptk.Model.call(this);

    this._client = new xmpptk.Client(cfg);

    this._client.login(
        function() {
            this.logger.info("logged in successfully");
            
        },
        this
    );

    goog.events.listen(
        goog.dom.getElementsByTagNameAndClass('body')[0],
        goog.events.EventType.UNLOAD,
        goog.bind(
            function() {
                this.logger.info("logging out");
                this._client.logout();
            },
            this
        )
    );
};
goog.inherits(helpim.Client, xmpptk.Model);

/**
 * @protected
 * @type {goog.debug.Logger}
 */
helpim.Client.prototype.logger = goog.debug.Logger.getLogger('helpim.Client');