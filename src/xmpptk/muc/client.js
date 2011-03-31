goog.provide('xmpptk.muc.Client');
goog.provide('xmpptk.muc.NS');

goog.require('goog.object');
goog.require('goog.debug.Logger');

goog.require('xmpptk.Client');

/**
 * @constructor
 * @inherits {xmpptk.Client}
 */
xmpptk.muc.Client = function() {
    xmpptk.Client.call(this);

    this._logger = goog.debug.Logger.getLogger('xmpptk.muc.Client');
    this._logger.info("instantiated");

    this.rooms = {};

};
goog.inherits(xmpptk.muc.Client, xmpptk.Client);
goog.addSingletonGetter(xmpptk.muc.Client);

xmpptk.muc.Client.prototype.login = function(callback, context) {
    goog.base(this, 'login', callback, context);

    // register handlers
    this._con.registerHandler('message', '*', '*', 'groupchat', goog.bind(this._handleGroupchatPacket, this));
    this._con.registerHandler('presence', 'x', xmpptk.muc.NS.USER, goog.bind(this._handleGroupchatPacket, this));
}

/**
 * @param {xmpptk.muc.Room} room
 */
xmpptk.muc.Client.prototype.registerRoom = function(room) {
    this._logger.info("registering room with id "+room.id);
    this.rooms[room.id] = room;
    this.notify();
};

xmpptk.Client.prototype.sendMessage = function(jid, message) {
    var m = new JSJaCMessage();
    m.setTo(jid);
    m.setType('groupchat');
    m.setBody(message);

    this._con.send(m);
};


/**
 * @param {xmpptk.muc.Room} room
 */
xmpptk.muc.Client.prototype.unregisterRoom = function(room) {
    this._logger.info("unregistering room with id "+room.id);
    delete this.rooms[room.id];
    this.notify();
};


xmpptk.muc.Client.prototype._handleGroupchatPacket = function(oJSJaCPacket) {
    this._logger.info("handling muc packet: "+oJSJaCPacket.xml());

    var room_id = oJSJaCPacket.getFromJID().removeResource().toString();
    if (this.rooms[room_id]) {
        this._logger.info("handing over to room with id "+room_id);
        try {
            this.rooms[room_id]['handleGroupchat_'+oJSJaCPacket.pType()](oJSJaCPacket);
        } catch(e) {
            this._logger.severe("failed to call room's handleGroupchatPacket", e);
        }
    }

    return true; // no one else needs to handle this
};

/** @enum {string} */
xmpptk.muc.NS = {
    USER: 'http://jabber.org/protocol/muc#user'
};