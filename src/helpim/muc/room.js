goog.provide('helpim.muc.Room');

goog.require('xmpptk.muc.Room');

/**
 * @constructor
 * @extends {xmpptk.muc.Room}
 * @inheritDoc
 */
helpim.muc.Room = function(client, room_jid, password) {
    xmpptk.muc.Room.call(this, client, room_jid, password);
};
goog.inherits(helpim.muc.Room, xmpptk.muc.Room);

helpim.muc.Room.prototype._logger = goog.debug.Logger.getLogger('helpim.muc.Room');

helpim.muc.Room.prototype.part = function(cb) {
    // unregister handlers
    this._client.unregisterRoom(this);

    // send presence
    this._client.sendPresence('unavailable', 'Clean Exit', this.jid);
};
