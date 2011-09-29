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
	this.clientsWaiting = false;
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

/**
 * leaves the room
 */
helpim.muc.Room.prototype.part = function() {
    // unregister handlers
    this._client.unregisterRoom(this);

    // send presence
    this._client.sendPresence('unavailable', 'Clean Exit', this.jid);
};

/**
 * @inheritDoc
 */
helpim.muc.Room.prototype._handleGroupchatPresence = function(oPres) {
	goog.base(this, '_handleGroupchatPresence', oPres, this);
	var client = oPres.getChild('client', helpim.Client.NS.HELPIM_ROOMS);
	if (client) {
		var status = client.getAttribute('status');
		if (status && status == 'unavailable') {
			// client left waiting room
			this._waitingClients--;
			if (this._waitingClients == 0) {
				this.set('clientsWaiting', false);
			} 
		} else {
			this._waitingClients++;
			if (!this.clientsWaiting) {
				this.set('clientsWaiting', true);
			}
		}
	}
};
