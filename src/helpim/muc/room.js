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

    this.attachPropertyhandler(
        'admitted',
        function(prop, val) {
            this._logger.info('we\'re admitted to the room '+prop+':'+val);
            if (!xmpptk.Config['is_staff'] && xmpptk.Config['muc_subject']) {
                this._logger.info("sending subject: "+xmpptk.Config['muc_subject']);
                var m = new JSJaCMessage();
                m.setTo(this.id);
                m.setType('groupchat');
                m.setSubject(xmpptk.Config['muc_subject']);
                this._client._con.send(m);
            }
        },
        this
    );
};
goog.inherits(helpim.muc.Room, xmpptk.muc.Room);

helpim.muc.Room.prototype._logger = goog.debug.Logger.getLogger('helpim.muc.Room');

helpim.muc.Room.prototype.part = function() {
    // unregister handlers
    this._client.unregisterRoom(this);

    // send presence
    this._client.sendPresence('unavailable', 'Clean Exit', this.jid);
};
