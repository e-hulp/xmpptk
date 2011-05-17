goog.provide('helpim.jsjac_ext');

goog.require('goog.array');

/**
 * @type {string}
 * @const
 */
helpim.jsjac_ext.NS_CHAT_STATE = 'http://jabber.org/protocol/chatstates';

/**
 * @type {Array.<string>}
 * @const
 */
helpim.jsjac_ext.CHAT_STATES = ['active', 'inactive', 'composing', 'paused', 'gone'];

JSJaCMessage.prototype.setChatState = function(state) {
    if (goog.array.contains(helpim.jsjac_ext.CHAT_STATES, state)) {
	this.appendNode(state, {'xmlns': helpim.jsjac_ext.NS_CHAT_STATE});
    }
    return this;
};

JSJaCMessage.prototype.getChatState = function() {
    var stateEl = this.getChild('*', helpim.jsjac_ext.NS_CHAT_STATE);
    if (stateEl)
	return stateEl.tagName;
    else
	return '';
};
