goog.provide('helpim.Client');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.debug.Logger');

goog.require('xmpptk.Client');
goog.require('xmpptk.muc.Room');

/**
 * @constructor
 * @extends {xmpptk.Client}
 */
helpim.Client = function() {
    this._logger.info("starting up");
    xmpptk.Client.call(this);

    this.login(
        function() {
            this._logger.info("logged in successfully");
            this.room = new xmpptk.muc.Room({room:    xmpptk.Config.muc_room,
                                             service: xmpptk.Config.muc_service,
                                             nick:    xmpptk.Config.muc_nick},
                                            this);

            this.room.join();
        },
        this
    );

    goog.events.listen(
        window,
        goog.events.EventType.UNLOAD,
        goog.bind(function() {
            this.room.part();
            this.logout();
        }, this)
    );
};
goog.inherits(helpim.Client, xmpptk.Client);
goog.addSingletonGetter(helpim.Client);

/**
 * @protected
 * @type {goog.debug.Logger}
 */
helpim.Client.prototype._logger = goog.debug.Logger.getLogger('helpim.Client');