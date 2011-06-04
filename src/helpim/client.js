goog.provide('helpim.Client');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.debug.Logger');
goog.require('goog.net.cookies');
goog.require('goog.json');

goog.require('xmpptk.Config');
goog.require('xmpptk.muc.Client');

goog.require('helpim.jsjac_ext');
goog.require('helpim.muc.Room');
goog.require('helpim.ui.Client');
goog.require('helpim.ui.Room');

/**
 * @constructor
 * @extends {xmpptk.muc.Client}
 */
helpim.Client = function() {
    this._logger.info("starting up");
    xmpptk.muc.Client.call(this);

    this._composingTimeout = xmpptk.getConfig('composing_timeout', helpim.Client.COMPOSING_TIMEOUT);
    this._composingSent = {};
    this._composingTimeouts = {};
    this._view = new helpim.ui.Client(this);

    this.login();

    goog.events.listen(
        window,
        goog.events.EventType.UNLOAD,
        this.logout,
        false,
        this
    );
};
goog.inherits(helpim.Client, xmpptk.muc.Client);
goog.addSingletonGetter(helpim.Client);

/**
 * seconds to wait till 'paused' state is sent after state 'composing'
 * @type {number}
 * @const
 */
helpim.Client.COMPOSING_TIMEOUT = 10;

/**
 * seconds till cookie will expire for a staff member
 * @type {boolean}
 * @const
 */
helpim.Client.COOKIE_EXPIRES_FOR_STAFF = 86400;

/**
 * @protected
 * @type {goog.debug.Logger}
 */
helpim.Client.prototype._logger = goog.debug.Logger.getLogger('helpim.Client');

helpim.Client.prototype.login = function() {
    var timer = goog.now();
    goog.base(
        this,
        'login',
        function() {
            this._logger.info("logged in successfully in "+(goog.now()-timer)+"ms");
            var room_jid = {'room':    xmpptk.Config['muc_room'],
                            'service': xmpptk.Config['muc_service'],
                            'nick':    xmpptk.Config['muc_nick']};
            var room_password = xmpptk.Config['muc_password'];

            room = new helpim.muc.Room(this,
                                       room_jid,
                                       room_password);
            room.join();

            var expires = xmpptk.Config['is_staff']? helpim.Client.COOKIE_EXPIRES_FOR_STAFF:-1;
            goog.net.cookies.set('room_id', room.id, expires);
            if (!xmpptk.Config['is_staff']) {
                goog.net.cookies.set('room_nick', xmpptk.Config['muc_nick']);
                goog.net.cookies.set('room_subject', xmpptk.Config['muc_subject']);
            }
        },
        this
    );
};

helpim.Client.prototype.logout = function(cb) {
    goog.object.forEach(
        this.rooms,
        function(room) {
            room.part();
        }
    );
    goog.object.clear(this.rooms);
    this.notify();
    goog.base(this, 'logout');

    if (cb && typeof cb == 'function') {
        cb();
    }
};

/**
 * @inheritDoc
 */
helpim.Client.prototype.sendMessage = function(jid, message) {
    if (!goog.isString(message) || message == '') {
        this._logger.info("not sending empty message");
        return;
    }

    // make sure we don't send 'paused' state by accident
    this._clearComposingTimeout(jid);
    this._composingSent[jid] = false;

    var m = new JSJaCMessage();
    m.setTo(jid);
    m.setType('groupchat');
    m.setBody(message);
    m.setChatState('active');
    this._con.send(m);
};

/**
 * Sends a chat state notification about user being composing a message
 * @param {string} jid the jid of the room to send message to
 */
helpim.Client.prototype.sendComposing = function(jid) {
    if (!this._composingSent[jid]) {
        this._composingSent[jid] = true;
        var m = new JSJaCMessage();
        m.setTo(jid);
        m.setType('groupchat');
        m.setChatState('composing');
        this._con.send(m);
    }

    this._setComposingTimeout(
        jid,
        goog.bind(
            function() {
                this._composingSent[jid] = false;
                var m = new JSJaCMessage();
                m.setTo(jid);
                m.setType('groupchat');
                m.setChatState('paused');
                this._con.send(m);
            },
            this
        ),
        this._composingTimeout*1000
    );
};

helpim.Client.prototype._setComposingTimeout = function(jid, callback, timeout) {
    this._clearComposingTimeout(jid);
    this._composingTimeouts[jid] = setTimeout(callback, timeout)
};

helpim.Client.prototype._clearComposingTimeout = function(jid) {
    if (this._composingTimeouts[jid]) {
        clearTimeout(this._composingTimeouts[jid]);
    }
    this._composingTimeouts[jid] = false;
};