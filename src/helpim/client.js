goog.provide('helpim.Client');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.debug.Logger');

goog.require('xmpptk.muc.Client');
goog.require('xmpptk.muc.Room');

goog.require('helpim.ui.Client');
goog.require('helpim.ui.Room');

/**
 * @constructor
 * @extends {xmpptk.muc.Client}
 */
helpim.Client = function() {
    this._logger.info("starting up");
    xmpptk.muc.Client.call(this);

    this._view = new helpim.ui.Client(this);

    this.login();

    goog.events.listen(
        window,
        goog.events.EventType.UNLOAD,
        this.logout,
        false, 
        this
    );
};
goog.inherits(helpim.Client, xmpptk.muc.Client);
goog.addSingletonGetter(helpim.Client);

/**
 * @protected
 * @type {goog.debug.Logger}
 */
helpim.Client.prototype._logger = goog.debug.Logger.getLogger('helpim.Client');

helpim.Client.prototype.login = function() {
    var timer = goog.now();
    goog.base(
        this,
        'login', 
        function() {
            this._logger.info("logged in successfully in "+(goog.now()-timer)+"ms");
            new xmpptk.muc.Room({room:    xmpptk.Config.muc_room,
                                 service: xmpptk.Config.muc_service,
                                 nick:    xmpptk.Config.muc_nick},
                                xmpptk.Config.muc_password,
                                this).join();
        },
        this
    );
};

helpim.Client.prototype.logout = function() {
    goog.object.forEach(
        this.rooms,
        function(room) {
            room.part();
        }
    );
    goog.object.clear(this.rooms);
    this.notify();
    goog.base(this, 'logout');
};