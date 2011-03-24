goog.provide('helpim.Client');

goog.require('xmpptk.Client');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.debug.Logger');

/**
 * @constructor
 * @extends {xmpptk.Client}
 */
helpim.Client = function() {
    this.logger.info("starting up");
    xmpptk.Client.call(this);

    this.login(
        function() {
            this.logger.info("logged in successfully");
            var room = new xmpptk.muc.Room({room:    cfg.muc_room,
                                            service: cfg.muc_service,
                                            nick:    cfg.muc_nick});

            room.join();
        },
        this
    );

    goog.events.listen(
        goog.dom.getElementsByTagNameAndClass('body')[0],
        goog.events.EventType.UNLOAD,
        goog.bind(
            function() {
                this.logger.info("logging out");
                this.logout();
            },
            this
        )
    );
};
goog.inherits(helpim.Client, xmpptk.Client);
goog.addSingletonGetter(helpim.Client);

/**
 * @protected
 * @type {goog.debug.Logger}
 */
helpim.Client.prototype.logger = goog.debug.Logger.getLogger('helpim.Client');