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
 * @param {xmpptk.muc.RoomJID} room_jid Config to denote the rooms identity
 * @param {xmpptk.muc.Client} client a muc enabled xmpp client
 * @param {?string} password an optional password to access to room with
 */
xmpptk.muc.Room = function(room_jid, client, password) {
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
 * handles a message packet directed to this room
 * @private
 * @param {JSJaCMessage} oMsg a presence packet
 * @return {boolean}
 */
xmpptk.muc.Room.prototype._handleGroupchatMessage = function(oMsg) {
    this._logger.info("room got a message: "+oMsg.xml());

    var subject = oMsg.getSubject();
    var from = oMsg.getFromJID().getResource();

    if (subject) {
        this._logger.info("got subject: "+subject);
        this.set('subject', subject);
    } else {
        var chatState = oMsg.getChatState();
        if (chatState != '') {
            this.chatStates[from] = chatState;
        }
        this._logger.info("got a chatState from "+from+": "+chatState);
        if (oMsg.getBody() == '') {
            this.notify();
            return;
        }
        this.chatStates[from] = '';
        this.messages.push(
            {'from': from,
             'body': oMsg.getBody(),
             'type': oMsg.getType()}
        );
    }
    this.notify();
};

/**
 * handles a presence packet directed to this room
 * @private
 * @param {JSJaCPresence} oPres a presence packet
 * @return {boolean}
 */
xmpptk.muc.Room.prototype._handleGroupchatPresence = function(oPres) {
    this._logger.info("room got a presence: "+oPres.xml());

    var from = oPres.getFrom();
    if (oPres.getType() == 'unavailable') {
        if (this.roster.hasItem(from)) {
            this.roster.removeItem(from);
            this.events.push({'type': 'occupant_left',
                              'from': oPres.getFromJID().getResource()});
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
                                  'from': oPres.getFromJID().getResource()});
            }
        } else {
            this._logger.info("no item found for "+xmpptk.muc.NS.USER);
        }
    }

    this.notify();
    this._logger.info("done handling presence");
};

xmpptk.muc.Room.prototype.join = function() {
    this._logger.info("joining room "+this.jid+" with password "+this.password);

    // register handlers
    this._client.registerRoom(this);

    // send presence to rooms jid
    if (this.password != '') { 
        var extra = goog.bind(function(p) {
            return p.appendNode('x', {'xmlns': xmpptk.muc.NS.BASE}, 
                                [p.buildNode('password', {'xmlns': xmpptk.muc.NS.BASE}, this.password)]);
        }, this);
    } 

    this._client.sendPresence('available', undefined, this.jid, extra);
};

xmpptk.muc.Room.prototype.part = function() {
    // unregister handlers
    this._client.unregisterRoom(this);

    // send presence
    this._client.sendPresence('unavailable', undefined, this.jid);
};

xmpptk.muc.Room.prototype.sendMessage = function(msg) {
    this._client.sendMessage(this.id, msg);
};

xmpptk.muc.Room.prototype.sendComposing = function() {
    this._client.sendComposing(this.id);
};