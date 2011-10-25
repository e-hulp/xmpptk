goog.provide('helpim.ui.Client');

goog.require('goog.dom');
goog.require('goog.object');
goog.require('goog.json');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Button');
goog.require('goog.ui.FlatButtonRenderer');
goog.require('goog.ui.TabBar');
goog.require('goog.ui.Tab');
goog.require('goog.ui.RoundedTabRenderer');
goog.require('goog.ui.Dialog');

goog.require('xmpptk.ui.View');
goog.require('xmpptk.ui.emoticons');
goog.require('xmpptk.ui.sound');

goog.require('helpim.muc.Room');

goog.require('helpim.ui');
goog.require('helpim.ui.muc.Room');
goog.require('helpim.ui.Tab');
goog.require('helpim.ui.RoundedTabRenderer');

/**
 * @constructor
 * @param {helpim.Client} client
 * @extends {xmpptk.ui.View}
 */
helpim.ui.Client = function(client) {
    xmpptk.ui.View.call(this, client);

    this._rooms = {};

    xmpptk.ui.emoticons.init(xmpptk.Config['static_url']);
    xmpptk.ui.sound.init(xmpptk.Config['static_url']+'xmpptk/xmpptk/');

    client.subscribeOnce('disconnected', function() {
        document.location.replace(xmpptk.Config['logout_redirect']);
    });

    goog.events.listen(
        goog.dom.getElement('soundButton'),
        goog.events.EventType.CLICK,
        function(e) {
            if (xmpptk.ui.sound.enabled) {
                e.target.src = helpim.ui.getStatic('/xmpptk/xmpptk/images/stock_volume-mute.png');
            } else {
                e.target.src = helpim.ui.getStatic('/xmpptk/xmpptk/images/stock_volume.png');
            }
            xmpptk.ui.sound.enabled = !xmpptk.ui.sound.enabled;
        }
    );

    this.logoutButton = new goog.ui.Button(gettext('Stop Conversation'),
                                          goog.ui.FlatButtonRenderer.getInstance());
    this.logoutButton.render(goog.dom.getElement('logoutButton'));
    this.logoutButton.setValue('logout');
    goog.events.listen(
        this.logoutButton,
        goog.ui.Component.EventType.ACTION,
        function() {
			client.logout(true);
        },
        false,
        this);

    this.tabBar = new goog.ui.TabBar();
    this.tabBar.render(goog.dom.getElement('tabBar'));

    client.subscribe(
        helpim.Client.NS.HELPIM_ROOMS+'#errorIQ',
        function(cond) {
            var logout_on_submit = true;
            /* known conditions are:
             * - service-unavailable -> bot is down
             * - bad-request         -> bad xml was sent (hu?)
             * - item-not-found      -> no room available
             * - not-authorized      -> token sent was invalid
             * - not-allowed         -> requested more rooms as allowed
             */

            switch(cond) {
            case 'service-unavailable':
                cond = 'Service not available';
                break;
            case 'bad-request':
                cond = 'Bad Request';
                break;
            case 'item-not-found':
                if (!xmpptk.Config['is_staff']) {
                    document.location.replace(xmpptk.Config['unavailable_redirect']);
					return;
                }
				break;
            case 'not-authorized':
                cond = gettext("Sorry, you're not allowed to access this service");
                break;
            case 'not-allowed':
                cond = gettext("Sorry, you're not allowed to request more chats");
                logout_on_submit = false;
            }

            var dialog = new goog.ui.Dialog();
            dialog.setTitle(gettext('An error occured'));
            dialog.setContent(cond);
            dialog.setButtonSet(goog.ui.Dialog.ButtonSet.createOk());
            dialog.setHasTitleCloseButton(false);
            dialog.render(goog.dom.getElement("dialog"));

            if (logout_on_submit) {
                goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function(e) {
                    client.logout();
                });
            }

            dialog.setVisible(true);
        }
    );

    client.subscribe(
        'nick_required',
        function(callback) {
            var dialog = new goog.ui.Dialog();
            dialog.setTitle(gettext('Join Chat'));
            var content = '<div id="form_error" class="error"></div><form><div><label for="muc_nick">'+gettext('Nickname')+': </label><input id="muc_nick" maxlength="64"/></div>';
            if (xmpptk.Config['mode'] == 'light') {
                content += '<div><label for="muc_subject">'+gettext('Subject')+': </label><input id="muc_subject" maxlength="64"/></div>';
            }
            content += '</form>';
            dialog.setContent(content);
            dialog.setButtonSet(goog.ui.Dialog.ButtonSet.createOkCancel());
            dialog.setHasTitleCloseButton(false);
            dialog.render(goog.dom.getElement("dialog"));

            goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function(e) {
                if (e.key == 'ok') {
                    // get nick and subject from form submitted
                    var nick = goog.dom.getElement('muc_nick').value;
                    this._logger.info(nick);
                    if (!nick || nick == '') {
                        goog.dom.setTextContent(
                            goog.dom.getElement('form_error'),
                            gettext('Please provide a nickname!'));
                        return false;
                    }
                    var subject = goog.dom.getElement('muc_subject');
                    if (subject && subject.value && subject.value != '') {
                        subject = subject.value;
                    } else {
                        subject = '';
                    }
                    callback(nick, subject);
                } else {
                    client.logout();
                }
            }, false, this);
            dialog.setVisible(true);
            goog.dom.getElement('muc_nick').focus();
        },
        this
    );

	client.subscribe(
		'questionnaire_requested',
		function(params) {
			this._logger.info("got questionnaire url: "+params.url);

            var dialog = new goog.ui.Dialog();
            dialog.setTitle(gettext('Questionnaire'));
            dialog.setContent('<iframe width="410" height="640" src="'+params.url+'" style="border: 0px;"></iframe>');
            dialog.setButtonSet(false);
            dialog.setHasTitleCloseButton(false);
            dialog.render(goog.dom.getElement("dialog"));

			helpim.register('questionnaire_submitted', function(params1) {
				params.callback(params1);
				if (client._logoutDelayedTimeout) {
					dialog.setButtonSet(goog.ui.Dialog.ButtonSet.createOk());
					goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function(e) {
						client.logout(true, true);
					});
				} else {
					setTimeout(function() {
						dialog.setVisible(false);
					}, 3000);
				}
			});

            dialog.setVisible(true);

		},
		this
	);

    this._lastRoomSelected = null;

    goog.events.listen(
        this.tabBar,
        goog.ui.Component.EventType.SELECT,
        goog.bind(function(e) {
            var tabSelected = e.target;
            this._logger.info("tab selected for "+tabSelected.getId());
            var contentElement = goog.dom.getElement('tab_content');
            if (this._lastRoomSelected) {
                goog.style.showElement(
                    this._rooms[this._lastRoomSelected].getPanel(),
                    false
                );
            }
            goog.style.showElement(
                this._rooms[tabSelected.getId()].getPanel(),
                true
            );
            this._lastRoomSelected = tabSelected.getId();
        }, this)
    );

    goog.style.showElement(goog.dom.getElement('tab_content'), false);
    goog.style.showElement(goog.dom.getElement('helpimClient'), false);

    if (!xmpptk.Config['is_staff'] || xmpptk.Config['mode'] == 'light') {
        goog.style.showElement(goog.dom.getElement('tabBar'), false);
    }
};
goog.inherits(helpim.ui.Client, xmpptk.ui.View);

/**
 * @type {goog.debug.Logger}
 * @protected
*/
helpim.ui.Client.prototype._logger = goog.debug.Logger.getLogger('helpim.ui.Client');

helpim.ui.Client.prototype.update = function() {
    this._logger.info("model updated");

	if (xmpptk.Config['is_staff']) {
		this.logoutButton.setEnabled(goog.object.getCount(this.subject.rooms) <= 1);
	} else {
		this.logoutButton.setEnabled(true);
	}

    var count = 0;
    goog.object.forEach(
        this.subject.rooms,
        function(room, id) {
			this._logger.info("got room with id "+id);
            if (xmpptk.Config['is_staff']) {
                if (!this.tabBar.getChild(id)) {
                    this._logger.info("creating new room for "+id);
                    this._rooms[id] = new helpim.ui.muc.Room(room);
                    if (count == 0) {
                        // we're at the lobby
                        var tab = new goog.ui.Tab(gettext('staff'), new goog.ui.RoundedTabRenderer());
                    } else {
                        var title = gettext("waiting...");
                        var tab = new helpim.ui.Tab(title, new helpim.ui.RoundedTabRenderer());
                        tab.setOnCloseHandler(function() {
							// on close we should a confirmation
							// dialog. but only if there's another
							// participant in the room except for
							// ourselves and the bot
							if (goog.object.some(room.roster.get('items'), function(occupant) {
								return occupant.getNick() != room['nick'] && occupant.getNick() != xmpptk.Config['bot_nick']
							})) {
								var dlg = new goog.ui.Dialog();
								dlg.setTitle(gettext('Confirm'));
								dlg.setContent('<div class="goog_dialog">'+gettext("Are you sure you want to end this conversation?")+'</div>');
								dlg.setHasTitleCloseButton(true);
								dlg.setButtonSet(goog.ui.Dialog.ButtonSet.createOkCancel());
								dlg.render(goog.dom.getElement("dialog"));
								goog.events.listen(dlg, goog.ui.Dialog.EventType.SELECT, function(e) {
									if (e.key == 'ok') {
										room.part();
									}});
								dlg.setVisible(true);
							} else {
								// no need to show a dialog, just part
								room.part();
							}
                        });
                    }
                    this._rooms[id]._tab = tab; // let'em know
                    tab.setId(id);
                    this.tabBar.addChild(tab, true);
                    this.tabBar.setSelectedTab(tab);
                } else {
                    this._logger.info("not creating new room for "+id+" as it already exists");
                }
            } else {
                if (count == 0) {
                    if (!this._waitingdialog) {
                        // show waiting dialog
                        this._waitingdialog = new goog.ui.Dialog();
                        this._waitingdialog.setTitle(gettext('Please wait!'));
                        this._waitingdialog.setContent('<div class="goog_dialog">'+gettext("Please wait while we're acquiring a conversation for you! This can take some time.")+'</div><div class="ajax-loader"><img src="'+helpim.ui.getStatic('/helpim/ajax-loader.gif')+'"/></div>');
                        this._waitingdialog.setHasTitleCloseButton(false);
                        this._waitingdialog.setButtonSet(null);
                        this._waitingdialog.render(goog.dom.getElement("dialog"));
                        this._waitingdialog.setVisible(true);
                    }
                } else {
                    // show room
					if (!this._rooms[id]) {
						this._rooms[id] = new helpim.ui.muc.Room(room);
						if (this._waitingdialog) {
							this._logger.info("hiding waiting dialog");
							this._waitingdialog.setVisible(false);
						} else {
							this._logger.info("nothing to hide");
						}
					}
                }
            }
            count++;
        },
        this
    );
    this.tabBar.forEachChild(
        function(tab) {
            var id = tab.getId();
            if (!goog.object.some(this.subject.rooms, function(room) { return id == room.id; })) {
                this.tabBar.removeChild(tab, true);
            }
        },
        this
    );

    goog.style.showElement(goog.dom.getElement('tab_content'), !goog.object.isEmpty(this.subject.rooms));
};
