goog.provide('helpim.Client');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.debug.Logger');

goog.require('xmpptk.Config');
goog.require('xmpptk.muc.Client');
goog.require('xmpptk.muc.Room');

goog.require('helpim.jsjac_ext');
goog.require('helpim.ui.Client');
goog.require('helpim.ui.Room');

/**
 * @constructor
 * @extends {xmpptk.muc.Client}
 */
helpim.Client = function() {
    this._logger.info("starting up");
    xmpptk.muc.Client.call(this);

    this._composingSent = {};
    this._composingTimeout = {};
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
            new xmpptk.muc.Room({'room':    xmpptk.Config['muc_room'],
                                 'service': xmpptk.Config['muc_service'],
                                 'nick':    xmpptk.Config['muc_nick']},
                                this,
                                xmpptk.Config['muc_password']).join();
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
        helpim.Client.COMPOSING_TIMEOUT*1000
    );
};

helpim.Client.prototype._setComposingTimeout = function(jid, callback, timeout) {
    this._clearComposingTimeout(jid);
    this._composingTimeout[jid] = setTimeout(callback, timeout)
};

helpim.Client.prototype._clearComposingTimeout = function(jid) {
    if (this._composingTimeout[jid]) {
        clearTimeout(this._composingTimeout[jid]);
    }
    this._composingTimeout[jid] = false;
};