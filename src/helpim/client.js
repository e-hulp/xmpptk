goog.provide('helpim.Client');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.debug.Logger');

goog.require('xmpptk.Client');
goog.require('xmpptk.muc.Room');

goog.require('helpim.ui.Client');
goog.require('helpim.ui.Room');

/**
 * @constructor
 * @extends {xmpptk.Client}
 */
helpim.Client = function() {
    this._logger.info("starting up");
    xmpptk.Client.call(this);

    this.rooms = [];

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
goog.inherits(helpim.Client, xmpptk.Client);
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
            this.addRoom(
                new xmpptk.muc.Room({room:    xmpptk.Config.muc_room,
                                     service: xmpptk.Config.muc_service,
                                     nick:    xmpptk.Config.muc_nick},
                                    this)
            ).join();
        },
        this
    );
};

/**
 * @param {xmpptk.muc.Room} room
 */
helpim.Client.prototype.addRoom = function(room) {
    try {
        new helpim.ui.Room(room);
    } catch(e) { this._logger.severe("failed creating view", e); }
    this.rooms.push(room);
    this.notify();
    return room;
};

/**
 * @param {xmpptk.muc.Room} room
 */
helpim.Client.prototype.deleteRoom = function(room) {
    goog.array.remove(this.rooms, room);
    this.notify();
    return room;
};

helpim.Client.prototype.logout = function() {
    goog.array.forEach(
        this.rooms,
        function(room) {
            room.part();
        }
    );
    goog.array.clear(this.rooms);
    this.notify();
    goog.base(this, 'logout');
};