goog.provide('helpim.Client');

goog.require('helpim.Config');

goog.require('xmpptk.model');
goog.require('xmpptk.Client');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.debug.Logger');

/**
 * @constructor
 * @extends {xmpptk.model}
 * @param {helpim.Config} cfg A configuration
 */
helpim.Client = function(cfg) {
    xmpptk.model.call(this);

    this._client = new xmpptk.Client(cfg);

    this._client.login(
        function() {
            this.logger.info("logged in successfully");
            this._client.getRoster(
                function(roster) {
                    this.logger.info("got roster:" + roster);
                },
                this
            );
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
goog.inherits(helpim.Client, xmpptk.model);

/**
 * @protected
 * @type {goog.debug.Logger}
 */
helpim.Client.prototype.logger = goog.debug.Logger.getLogger('helpim.Client');