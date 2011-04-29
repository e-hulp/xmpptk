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
 * @inherits {xmpptk.Model}
 * @param {xmpptk.muc.RoomJID} room_jid Config to denote the rooms identity
 * @param {xmpptk.muc.Client} client
 * @param {?string} password
 */
xmpptk.muc.Room = function(room_jid, client, password) {
    this._logger.info("creating room " + goog.json.serialize(room_jid));

    // keep calm! it's better than you think, isn't it?
    goog.object.extend(this, room_jid);

    xmpptk.Model.call(this);

    this.id = this.room+'@'+this.service;

    /** @type {string} */
    this.jid = this.room+'@'+this.service+'/'+this.nick;

    /** @type {string} */
    this.password = password || '';

    /** @type {xmpptk.muc.Roster} */
    this.roster = new xmpptk.Collection(xmpptk.muc.Occupant, 'jid');

    /** @type {string} */
    this.subject = '';

    this.messages = [];

    /** @private */
    this._client = client;
};
goog.inherits(xmpptk.muc.Room, xmpptk.Model);

xmpptk.muc.Room.prototype._logger = goog.debug.Logger.getLogger('xmpptk.muc.Room');

xmpptk.muc.Room.prototype.handleGroupchat_message = function(oMsg) {
    this._logger.info("room got a message: "+oMsg.xml());

    var subject = oMsg.getSubject();
    if (subject) {
        this._logger.info("got subject: "+subject);
        this.set('subject', subject);
    } else {
        this.messages.push(oMsg);
    }
    this.notify();
};

xmpptk.muc.Room.prototype.handleGroupchat_presence = function(oPres) {
    this._logger.info("room got a presence: "+oPres.xml());

    var from = oPres.getFrom();
    if (oPres.getType() == 'unavailable') {
        if (this.roster.hasItem(from)) {
            this.roster.removeItem(from);
        }
    } else {

        var occupant = this.roster.getItem(from);

        var item = oPres.getChild('item', xmpptk.muc.NS.USER);
        if (item) {
            occupant.set({
                affiliation: item.getAttribute('affiliation'),
                role:        item.getAttribute('role'),
                real_jid:    item.getAttribute('jid')
            });
        }
    }

    this.notify();
};

xmpptk.muc.Room.prototype.join = function() {
    this._logger.info("joining room "+this.jid);

    // register handlers
    this._client.registerRoom(this);

    // send presence to rooms jid
    var password = (this.password=='')?[]:[{'password', this.password}];
    var payload = {'x', {'xmlns': xmpptk.muc.NS.BASE}, password};

    this._client.sendPresence('available', undefined, this.jid, payload);
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