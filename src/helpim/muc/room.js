goog.provide('helpim.muc.Room');

goog.require('xmpptk.muc.Room');

/**
 * @constructor
 * @extends {xmpptk.muc.Room}
 * @inheritDoc
 */
helpim.muc.Room = function(client, room_jid, password, is_one2one) {
    xmpptk.muc.Room.call(this, client, room_jid, password);
	this.is_one2one = is_one2one || false;
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

helpim.muc.Room.prototype.join = function(callback) {
	this.subscribeOnce('nick_conflict', function() {
		this['nick'] += '_';
		this.jid = this.id + '/' + this['nick'];
		this._logger.info("nick conflict! adopting nick to "+this['nick']+"and automatically rejoin room");
		this.join(callback);
	}, this);
	goog.base(this, 'join', callback, this);
};

/**
 * leaves the room
 * @param {boolean} clean whether this is a clean exit
 */
helpim.muc.Room.prototype.part = function(clean) {
    // unregister handlers
    this._client.unregisterRoom(this);

    // send presence
	var message = clean?'Clean Exit':null;
    this._client.sendPresence('unavailable', message, this.jid);
};

helpim.muc.Room.prototype.requestRoom = function() {
	this._client.requestRoom(xmpptk.Config['bot_jid'], xmpptk.Config['token']);
};