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
goog.require('helpim.ui.ClientRunning');

/**
 * @constructor
 * @extends {xmpptk.muc.Client}
 */
helpim.Client = function() {
    this._logger.info("starting up");

    if (goog.net.cookies.containsKey('client_running')) {
        this._logger.info("aborting");
        xmpptk.muc.Client.call(this);
        this._view = new helpim.ui.ClientRunning(this);
        return;
    }

    goog.net.cookies.set('client_running', true);

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
 * our well known namespaces
 * @const
 */
helpim.Client.NS = {
    HELPIM_ROOMS: "http://helpim.org/protocol/rooms"
};

/**
 * @protected
 * @type {goog.debug.Logger}
 */
helpim.Client.prototype._logger = goog.debug.Logger.getLogger('helpim.Client');

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

/**
 * advise client to join a chat room
 * @param {string} roomId the id of the room
 * @param {string} service the service hosting the room (e.g. 'conference.jabber.org')
 * @param {string} nick the desired nick within the room
 * @param {string?} password optional password if required
 * @param {string?} subject optional subject to set once room is joined
 * @return {helpim.muc.Room} the room object
*/
helpim.Client.prototype.joinRoom = function(roomId, service, nick, password, subject) {
    var room = new helpim.muc.Room(
        this,
        {'room': roomId,
         'service': service,
         'nick': nick},
        password
    );
    room.join(
        function() { 
            if (subject) {
                room.setSubject(subject); 
            }
        }
    );
    return room;
}

/**
 * @inheritDoc
 */
helpim.Client.prototype.login = function() {
    var timer = goog.now();
    goog.base(
        this,
        'login',
        function() {
            this._logger.info("logged in successfully in "+(goog.now()-timer)+"ms");
            this.requestRoom(xmpptk.Config['bot_jid'], xmpptk.Config['token']);
        },
        this
    );
};

/**
 * @inheritDoc
 */
helpim.Client.prototype.logout = function() {
    goog.net.cookies.remove('client_running');
    goog.base(this, 'logout');
};

/**
 * @inheritDoc
 */
helpim.Client.prototype.logoutCleanExit = function() {
    // cookie can safely be removed as we don't want to return to this room
    goog.net.cookies.remove('room_token');

    goog.object.forEach(
        this.rooms,
        function(room) {
            room.part();
        }
    );
    goog.object.clear(this.rooms);
    this.notify();

    this.sendPresence('unavailable', 'Clean Exit');

    // we need to delay disconnecting because otherwise it happens
    // that tigase looses our last messages
    setTimeout(goog.bind(this.logout, this), 100);
};

/**
 * Request a room from bot
 * @param {string} jid the service bot's jid - this one will be contacted to ask for a room
 * @param {string} token the token to validate the request with
 * @param {string?} nick the nick used for actually joining the room
 * @param {string?} subject a subject to set when joining the room
 */
helpim.Client.prototype.requestRoom = function(jid, token, nick, subject) {
    this._logger.info('bot_jid: '+jid);
    // ask bot for a room
    var iq = new JSJaCIQ();
    iq.setTo(jid).setType('get');
    var query = iq.setQuery(helpim.Client.NS.HELPIM_ROOMS);
    query.appendChild(iq.buildNode('token', {'xmlns': helpim.Client.NS.HELPIM_ROOMS}, token));
    this._con.sendIQ(
        iq,
        {'result_handler': goog.bind(function(resIq) {
            this._logger.info('result: '+resIq.xml());
            if (xmpptk.Config['is_staff']) {
                
                // just go straight to the room
                this.joinRoom(resIq.getChildVal('room',
                                                helpim.Client.NS.HELPIM_ROOMS),
                              resIq.getChildVal('service',
                                                helpim.Client.NS.HELPIM_ROOMS),
                              xmpptk.Config['muc_nick'],
                              resIq.getChildVal('password',
                                                helpim.Client.NS.HELPIM_ROOMS));
            } else {
                nick = resIq.getChildVal('nick',
                                         helpim.Client.NS.HELPIM_ROOMS) || nick;
                if (nick) {
                    // either nick supplied by bot or by form from cycle before
                    this.joinRoom(resIq.getChildVal('room',
                                                    helpim.Client.NS.HELPIM_ROOMS),
                                  resIq.getChildVal('service',
                                                    helpim.Client.NS.HELPIM_ROOMS),
                                  nick,
                                  resIq.getChildVal('password',
                                                    helpim.Client.NS.HELPIM_ROOMS),
                                  subject);
                } else {

                    // indicate ui to ask for nick and subject
                    this.publish(
                        helpim.Client.NS.HELPIM_ROOMS+'#resultIQ',
                        {'room': resIq.getChildVal(
                            'room',
                            helpim.Client.NS.HELPIM_ROOMS),
                         'service': resIq.getChildVal(
                             'service',
                             helpim.Client.NS.HELPIM_ROOMS),
                         'password': resIq.getChildVal(
                             'password',
                             helpim.Client.NS.HELPIM_ROOMS)});
                }
            }

            var expires = xmpptk.Config['is_staff']? helpim.Client.COOKIE_EXPIRES_FOR_STAFF:-1;
            goog.net.cookies.set('room_token', xmpptk.Config['token'], expires);
        }, this),
         'error_handler': goog.bind(function(errIq) {
             this._logger.info('error: '+errIq.xml());
             this.publish(helpim.Client.NS.HELPIM_ROOMS+'#errorIQ', 
                          errIq.getChild('error').firstChild.tagName);
             goog.net.cookies.remove('room_token');

         }, this)
        }
    );
};

/**
 * @inheritDoc
 */
helpim.Client.prototype.sendGroupchatMessage = function(jid, message) {
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

/**
 * set a callback to call when a composing event times out for a given jid
 * @private
 * @param {string} jid the jid the composing event was associated with
 * @param {function()} callback the function to call when timeout occurs
 * @param {number} timeout the timeout in msec
 */
helpim.Client.prototype._setComposingTimeout = function(jid, callback, timeout) {
    this._clearComposingTimeout(jid);
    this._composingTimeouts[jid] = setTimeout(callback, timeout)
};

/**
 * clear a composing timeout
 * @private
 * @param {string} jid the jid the timeout was associated with
 */
helpim.Client.prototype._clearComposingTimeout = function(jid) {
    if (this._composingTimeouts[jid]) {
        clearTimeout(this._composingTimeouts[jid]);
    }
    this._composingTimeouts[jid] = false;
};