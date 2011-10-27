goog.provide('helpim.ui.muc.One2OneRoom');

goog.require('helpim.ui.muc.Room');

/**
 * @constructor
 */
helpim.ui.muc.One2OneRoom = function(room) {
	helpim.ui.muc.Room.call(this, room);

    this._focused = false;
    window.onblur = goog.bind(function() { this._focused = false; }, this);
    window.onfocus = goog.bind(function() { this._focused = true; }, this);

    this._ringing = false;
};
goog.inherits(helpim.ui.muc.One2OneRoom, helpim.ui.muc.Room);

helpim.ui.muc.One2OneRoom.prototype._logger = goog.debug.Logger.getLogger('helpim.ui.muc.One2OneRoom');

helpim.ui.muc.One2OneRoom.prototype._occupantJoined = function(event) {

    if (event['from'] == xmpptk.Config['bot_nick']) {
		// not showing events from bot
		return;
	}

 	goog.base(this, '_occupantJoined', event, this);

	if (xmpptk.Config['is_staff']) {

		if (event['from'] == this.subject['nick']) {
            this.appendMessage({body: interpolate(gettext('Welcome %s, now wait for a client to join!'), [xmpptk.ui.htmlEnc(this.subject.get('nick'))]), className:'roomEvent'});
			return;
		}

		// this is for blocking participants which is only available for staff at one2one rooms
		this._participant = event['from'];

        // set our tab's title to nick of client
        this._tab.setCaption(event['from']);
        if (!this._tab.isSelected()) {
            this._tab.setHighlighted(true);
        }

		if (!this._focused) {
			if (!this._ringing) {
				// taken from
				// http://stackoverflow.com/questions/37122/make-browser-window-blink-in-task-bar
				// combined with
				// http://stackoverflow.com/questions/4257936/window-onmousemove-in-ie-and-firefox
				var oldTitle = document.title;
				var msg = gettext("Ring! Ring!");
				var ring = 0;
				var timeoutId = setInterval(function() {
					document.title = (document.title == msg)?oldTitle:msg;
					if ((ring % 5) == 0) {
						xmpptk.ui.sound.play('ring');
					}
					ring++;
				}, 1000);

				this._ringing = true;

				var stopRinging = goog.bind(function(handler, fun) {
					if (this._ringing) {
						clearInterval(timeoutId);
						document.title = oldTitle;
						this._ringing = false;
					}
				}, this);
				document.onmousemove = function() {
					stopRinging();
					document.onmousemove = null;
				}

				var oldonfocus = window.onfocus;
				window.onfocus = function() {
					stopRinging();
					oldonfocus();
					window.onfocus = oldonfocus;
				}
			}
		}
		this._blockParticipantButton.setEnabled(true);
	} else { // end is_staff
		xmpptk.ui.sound.play('ring');
	}
	if (!this._focused) {
		window.focus();
	}
	// we're ready to chat
	this._sendTextarea.setEnabled(true);
	this._sendTextarea.setFocused(true);

};

helpim.ui.muc.One2OneRoom.prototype._occupantLeft = function(event) {
	goog.base(this, '_occupantLeft', event, this);
	this._sendTextarea.setEnabled(false);
};

helpim.ui.muc.One2OneRoom.prototype._render = function() {
	goog.base(this, '_render');

	// will be enabled once other participant joins
	this._sendTextarea.setEnabled(false);

    // sir hide-a-lot
    goog.style.showElement(this._rosterPanel, false);
    goog.style.setStyle(this._messagesPanel, 'margin-right', '0');
    goog.style.setStyle(goog.dom.getElementByClass('sendPanel', this._panel), 'margin-right', '0');

	if (xmpptk.Config['is_staff']) {
		this._blockParticipantButton =  new goog.ui.Button(gettext('Block Participant'),
														   goog.ui.FlatButtonRenderer.getInstance());
		this._blockParticipantButton.render(goog.dom.getElementByClass('blockParticipantButton', this._panel));

		goog.events.listen(
			this._blockParticipantButton,
			goog.ui.Component.EventType.ACTION,
			function() {

				var dialog = new goog.ui.Dialog();
				dialog.setTitle(gettext('Block Participant'));
				dialog.setContent('Are you sure you want to block this participant?');
				dialog.setButtonSet(goog.ui.Dialog.ButtonSet.createOkCancel());
				dialog.setHasTitleCloseButton(false);
				dialog.render(goog.dom.getElement("dialog"));

				goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function(e) {
					if (e.key == 'ok') {
						// send message to bot to block user
						this.subject.blockParticipant(
							this._participant,
							goog.bind(function() {
								var dialog = new goog.ui.Dialog();
								dialog.setTitle(gettext('Block participant'));
								dialog.setContent('The participant has been blocked successfully');
								dialog.setButtonSet(goog.ui.Dialog.ButtonSet.createOk());
								dialog.setHasTitleCloseButton(false);
								dialog.render(goog.dom.getElement("dialog"));
								dialog.setVisible(true);
								this._blockParticipantButton.setEnabled(false);
							}, this),
							function() {
								var dialog = new goog.ui.Dialog();
								dialog.setTitle(gettext('Error'));
								dialog.setContent('There was an error blocking the participant');
								dialog.setButtonSet(goog.ui.Dialog.ButtonSet.createOk());
								dialog.setHasTitleCloseButton(false);
								dialog.render(goog.dom.getElement("dialog"));
								dialog.setVisible(true);
							}
						);
					}
				}, false, this);

				dialog.setVisible(true);

			},
			false,
			this
		);

		this._blockParticipantButton.setEnabled(false);
	}

};