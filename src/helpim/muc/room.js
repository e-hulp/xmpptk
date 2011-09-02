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

/**
 * send iq to bot to advise blocking of participant related to given jid.
 * must be staff to do so.
 * @param {string} participant the nick of the participant to block
 */
helpim.muc.Room.prototype.blockParticipant = function(participant, success, error) {
    if (!xmpptk.Config['is_staff']) {
        // no need to try cause bot would cancel the request anyway
        return;
    }
    this._client.blockParticipant(this.id+'/'+xmpptk.Config['bot_nick'], this.id+'/'+participant, success, error)
}

helpim.muc.Room.prototype.part = function(cb) {
    // unregister handlers
    this._client.unregisterRoom(this);

    // send presence
    this._client.sendPresence('unavailable', 'Clean Exit', this.jid);
};
