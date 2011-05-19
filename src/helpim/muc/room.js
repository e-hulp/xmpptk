goog.provide('helpim.muc.Room');

goog.require('xmpptk.muc.Room');

/**
 * @constructor
 * @extends {xmpptk.muc.Room}
 * @param {xmpptk.muc.RoomJID} room_jid Config to denote the rooms identity
 * @param {xmpptk.muc.Client} client a muc enabled xmpp client
 * @param {?string} password an optional password to access to room with
 */
helpim.muc.Room = function(room_jid, client, password) {
    xmpptk.muc.Room.call(this, room_jid, client, password);
};
goog.inherits(helpim.muc.Room, xmpptk.muc.Room);

helpim.muc.Room.prototype._logger = goog.debug.Logger.getLogger('helpim.muc.Room');

/**
 * @inheritDoc
 */
helpim.muc.Room.prototype._handleGroupchatPresence = function(oPres) {
    var admitted = this.admitted;
    helpim.muc.Room.superClass_._handleGroupchatPresence.call(this, oPres);
    if (!admitted && this.admitted) {
        // we're now admitted to the room, send subject if we're a
        // care seeker
        if (!xmpptk.Config['is_staff'] && xmpptk.Config['muc_subject']) {
            this._logger.info("sending subject: "+xmpptk.Config['muc_subject']);
            var m = new JSJaCMessage();
            m.setTo(this.id);
            m.setType('groupchat');
            m.setSubject(xmpptk.Config['muc_subject']);
            this._client._con.send(m);
        }
    }
}