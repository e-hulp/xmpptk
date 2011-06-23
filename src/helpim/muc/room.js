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
            if (!xmpptk.Config['is_staff'] && this._room_subject_desired && this._room_subject_desired!='') {
                this._logger.info("sending subject: "+this._room_subject_desired);
                var m = new JSJaCMessage();
                m.setTo(this.id);
                m.setType('groupchat');
                m.setSubject(this._room_subject_desired);
                this._client._con.send(m);
            }
        },
        this
    );
};
goog.inherits(helpim.muc.Room, xmpptk.muc.Room);

helpim.muc.Room.prototype._logger = goog.debug.Logger.getLogger('helpim.muc.Room');

helpim.muc.Room.prototype.part = function(cb) {
    // unregister handlers
    this._client.unregisterRoom(this);

    // send presence
    if (cb) { cb(this); }
};
