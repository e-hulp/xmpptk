goog.provide('helpim.ui.muc.WaitingRoom');

goog.require('helpim.ui.muc.Room');

/**
 * @constructor
 */
helpim.ui.muc.WaitingRoom = function(room) {
	helpim.ui.muc.Room.call(this, room);
};
goog.inherits(helpim.ui.muc.WaitingRoom, helpim.ui.muc.Room);

helpim.ui.muc.WaitingRoom.prototype.hide = function() {
	if (this._waitingdialog) {
		this._waitingdialog.setVisible(false);
	};
};

/**
 * @inheritDoc
 */
helpim.ui.muc.WaitingRoom.prototype.appendMessage = function(message) {
	if (message) {
		goog.dom.setTextContent(this._message, message.body);
	}
};

/**
 * @inheritDoc
 */
helpim.ui.muc.WaitingRoom.prototype.formatMessage = function(msg) {
	if (msg.type == 'groupchat') { return; } // not handling groupchat messages here
	return goog.base(this, 'formatMessage', msg, this);
};

helpim.ui.muc.WaitingRoom.prototype._logger = goog.debug.Logger.getLogger('helpim.ui.muc.WaitingRoom');

helpim.ui.muc.WaitingRoom.prototype._render = function() {
	this._logger.info("rendering view");
    // show waiting dialog
    this._waitingdialog = new goog.ui.Dialog();
    this._waitingdialog.setTitle(gettext('Please wait!'));
    this._waitingdialog.setContent('<div class="goog_dialog">'+gettext("Please wait while we're acquiring a conversation for you! This can take some time.")+'</div><div id="waitingroom_message"></div><div class="ajax-loader"><img src="'+helpim.ui.getStatic('/helpim/ajax-loader.gif')+'"/></div>');
    this._waitingdialog.setHasTitleCloseButton(false);
    this._waitingdialog.setButtonSet(null);
    this._waitingdialog.render(goog.dom.getElement("dialog"));
    this._waitingdialog.setVisible(true);
	this._message = goog.dom.getElement('waitingroom_message');
};