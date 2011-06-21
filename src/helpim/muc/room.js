goog.provide('helpim.muc.Room');

goog.require('xmpptk.muc.Room');

/**
 * @constructor
 * @extends {xmpptk.muc.Room}
 * @inheritDoc
 */
helpim.muc.Room = function(client, room_jid, password) {
    xmpptk.muc.Room.call(this, client, room_jid, password);

    this.attachPropertyhandler(
        'admitted',
        function(val, prop) {
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
