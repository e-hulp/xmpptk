goog.provide('helpim.ui.muc.LobbyRoom');

goog.require('helpim.ui.muc.Room');

/**
 * @constructor
 */
helpim.ui.muc.LobbyRoom = function(room) {
	helpim.ui.muc.Room.call(this, room);
};
goog.inherits(helpim.ui.muc.LobbyRoom, helpim.ui.muc.Room);

helpim.ui.muc.LobbyRoom.prototype.update = function() {
    this._logger.info("update called");

    goog.dom.removeChildren(this._rosterPanel);
	var items = goog.object.getValues(this.subject.roster.getItems());
	goog.array.sort(items, function(a, b) {
		return (a.jid < b.jid)?-1:1;
	});
    goog.array.forEach(
		items,
        function(item) {
			var nick = (new JSJaCJID(item['jid'])).getResource();
            if (item.role == xmpptk.muc.Occupant.Role.NONE ||
				(!xmpptk.Config['debug'] && nick == xmpptk.Config['bot_nick'])) {
                return;
            }
            goog.dom.append(
                this._rosterPanel,
                goog.dom.createDom('div',
                                   {'class': 'rosterItem'},
                                   nick)
            );
        },
        this
    );
};

helpim.ui.muc.LobbyRoom.prototype._logger = goog.debug.Logger.getLogger('helpim.ui.muc.LobbyRoom');

helpim.ui.muc.LobbyRoom.prototype._render = function() {
	goog.base(this, '_render');

	this._requestClientButton =  new goog.ui.Button(gettext('Request Client'),
															goog.ui.FlatButtonRenderer.getInstance());
	this._requestClientButton.render(goog.dom.getElementByClass('requestClientButton', this._panel));

	goog.events.listen(
		this._requestClientButton,
		goog.ui.Component.EventType.ACTION,
		function() {
			this._requestClientButton.setEnabled(false);
			setTimeout(goog.bind(function() {
				this._requestClientButton.setEnabled(true);
			}, this), 5000);
			this.subject.requestRoom();
		},
		false,
		this
	);
	this._requestClientButton.setEnabled(true);
};