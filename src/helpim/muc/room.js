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
 * @param {string} bot the jid of the bot to talk to
 * @param {string} participant the jid of the participant to block
 */
helpim.Client.prototype.blockParticipant = function(bot, participant) {
    if (!xmpptk.Config['is_staff']) {
        // no need to try cause bot would cancel the request anyway
        return;
    }
    var iq = new JSJaCIQ();
    iq.setTo(bot);
    iq.setType('set');
    iq.appendNode('block', {xmlns: helpim.Client.NS.HELPIM_ROOMS}, [
        iq.buildNode('participant', {xmlns: helpim.Client.NS.HELPIM_ROOMS}, participant)
    ]);
    this._con.sendIQ(iq, {
        'result_handler': function() {},
        'error_handler': function() {}
    });
}

helpim.muc.Room.prototype.part = function(cb) {
    // unregister handlers
    this._client.unregisterRoom(this);

    // send presence
    this._client.sendPresence('unavailable', 'Clean Exit', this.jid);
};
