goog.provide('helpim.ui.muc.One2OneRoom');

goog.require('helpim.ui.muc.Room');

helpim.ui.muc.One2OneRoom = function(room) {
	helpim.ui.muc.Room.call(this, room);
};
goog.inherits(helpim.ui.muc.One2OneRoom, helpim.ui.muc.Room);

helpim.ui.muc.One2OneRoom.prototype._logger = goog.debug.Logger.getLogger('helpim.ui.muc.One2OneRoom');

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