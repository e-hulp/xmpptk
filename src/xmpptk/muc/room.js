goog.provide('xmpptk.muc.Room');
goog.provide('xmpptk.muc.RoomJID');

goog.require('goog.object');
goog.require('goog.json');
goog.require('goog.debug.Logger');

goog.require('xmpptk.Model');
goog.require('xmpptk.muc.Client');
goog.require('xmpptk.muc.Occupant');
goog.require('xmpptk.Collection');

/** @typedef {{room: string, service: string, nick: string}} */
xmpptk.muc.RoomJid;

/**
 * @constructor
 * @extends {xmpptk.Model}
 * @param {xmpptk.muc.Client} client a muc enabled xmpp client
 * @param {xmpptk.muc.RoomJID} room_jid Config to denote the rooms identity
 * @param {?string} password an optional password to access to room with
 */
xmpptk.muc.Room = function(client, room_jid, password) {
    this._logger.info("creating room " + goog.json.serialize(room_jid));

    // keep calm! it's better than you think, isn't it?
    goog.object.extend(this, room_jid);

    xmpptk.Model.call(this);

    /** @type {string} */
    this.id = this['room']+'@'+this['service'];

    /** @type {string} */
    this.jid = this['room']+'@'+this['service']+'/'+this['nick'];

    /** @type {string} */
    this.password = password || '';

    /** @type {xmpptk.muc.Roster} */
    this.roster = new xmpptk.Collection(xmpptk.muc.Occupant, 'jid');

    /** @type {string} */
    this.subject = '';

    /**
     * indicates whether we've been admitted to room or not
     * @type {boolean}
     */
    this.admitted = false;

    /** @type {array} */
    this.messages = [];

    /** @type {array} */
    this.events = [];

    /** @type {array} */
    this.chatStates = {};

    /**
     * @type {xmpptk.muc.Client}
     * @private */
    this._client = client;
};
goog.inherits(xmpptk.muc.Room, xmpptk.Model);

xmpptk.muc.Room.prototype._logger = goog.debug.Logger.getLogger('xmpptk.muc.Room');

/**
 * handle a JSJaCPacket directed to this room
 * @param {JSJaCPacket} oPacket a JSJaCPacket to handle
 */
xmpptk.muc.Room.prototype.handleGroupchatPacket = function(oPacket) {
    // actually looking for a more elegant solution, but hey, saw the
    // ponies?
    this._logger.info(oPacket.pType());
    switch (oPacket.pType()) {
    case 'presence': return this._handleGroupchatPresence(oPacket);
    case 'message': return this._handleGroupchatMessage(oPacket);
    }
};

/**
 * actually join the room
 * @param {function(object, string)} callback function to call when actually admitted to the room
 * @return {xmpptk.muc.Room} this rooms
 */
xmpptk.muc.Room.prototype.join = function(callback) {
    this._logger.info("joining room "+this.jid+" with password "+this.password);

    // register handlers
    this._client.registerRoom(this);

    // register callback
    if (callback) {
        this.attachPropertyhandler('admitted', callback);
    }

    // send presence to rooms jid
    if (this.password != '') {
        var extra = goog.bind(function(p) {
            return p.appendNode('x', {'xmlns': xmpptk.muc.NS.BASE},
                                [p.buildNode('password', {'xmlns': xmpptk.muc.NS.BASE}, this.password)]);
        }, this);
    }

    this._client.sendPresence('available', undefined, this.jid, extra);
    return this;
};

/**
 * leave this room
 */
xmpptk.muc.Room.prototype.part = function() {
    // unregister handlers
    this._client.unregisterRoom(this);

    // send presence
    this._client.sendPresence('unavailable', undefined, this.jid);
};

/**
  * send a message to the room (and thus to all occupants)
  * @param {string} msg the message to send
  */
xmpptk.muc.Room.prototype.sendMessage = function(msg) {
    this._client.sendMessage(this.id, msg);
};

/**
 * sends a composing event to the room (must be supported by conference service)
 */
xmpptk.muc.Room.prototype.sendComposing = function() {
    this._client.sendComposing(this.id);
};

/**
 * set subject of this room
 * @param {string} subject the subject to set
 */
xmpptk.muc.Room.prototype.setSubject = function(subject) {
    this._logger.info("sending subject: "+this._room_subject_desired);
    var m = new JSJaCMessage();
    m.setTo(this.id);
    m.setType('groupchat');
    m.setSubject(subject);
    this._client._con.send(m);
}

/**
 * handles a message packet directed to this room
 * @private
 * @param {JSJaCMessage} oMsg a presence packet
 * @return {boolean}
 */
xmpptk.muc.Room.prototype._handleGroupchatMessage = function(oMsg) {
    this._logger.info("room got a message: "+oMsg.xml());

    var roomSubject = oMsg.getSubject();
    var from = oMsg.getFromJID().getResource();

    if (roomSubject != '') {
        this._logger.info("got subject: "+roomSubject);
        this.set('subject', roomSubject);
    } else {
        var chatState = oMsg.getChatState();
        if (chatState != '') {
            this.chatStates[from] = chatState;
            this.set('chatStates', this.chatStates);
        }
        this._logger.info("got a chatState from "+from+": "+chatState);
        if (oMsg.getBody() == '') {
            this.notify();
            return;
        }
        this.chatStates[from] = '';
        this.set('chatStates', this.chatStates);
        this.messages.push(
            {'from': from,
             'body': oMsg.getBody(),
             'type': oMsg.getType()}
        );
        this.set('messages', this.messages);
    }
    this.notify();
};

/**
 * handles a presence packet directed to this room
 * @private
 * @param {JSJaCPresence} oPres a presence packet
 */
xmpptk.muc.Room.prototype._handleGroupchatPresence = function(oPres) {
    this._logger.info("room got a presence: "+oPres.xml());

    var from = oPres.getFrom();
    if (oPres.getType() == 'unavailable') {
        if (this.roster.hasItem(from)) {
            this.roster.removeItem(from);
            this.events.push({'type': 'occupant_left',
                              'from': oPres.getFromJID().getResource(),
                              'status': oPres.getStatus()});
            this.set('events', this.events);
        }
    } else {
        var occupant = this.roster.getItem(from);

        var x = oPres.getChild('x', xmpptk.muc.NS.USER);
        if (x) {
            var item = x.getElementsByTagName('item').item(0);
            if (item) {
                occupant.set({
                    'affiliation': item.getAttribute('affiliation'),
                    'role':        item.getAttribute('role'),
                    'real_jid':    item.getAttribute('jid')
                });
                this.events.push({'type': 'occupant_joined',
                                  'from': oPres.getFromJID().getResource(),
                                  'status': oPres.getStatus()});
                this.set('events', this.events);

                if (from == this.jid) {
                    // it's my own presence, check if we're part of the game now
                    var role = occupant.get('role');
                    if (!this.admitted) {
                        if (role != 'none' && role != 'outcast') {
                            this.set('admitted', true);
                        }
                    }
                }
            }
        } else {
            this._logger.info("no item found for "+xmpptk.muc.NS.USER);
        }
    }

    this.notify();
    this._logger.info("done handling presence");
};