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

goog.require('xmpptk.ui.View');
goog.require('xmpptk.ui.emoticons');
goog.require('xmpptk.ui.sound');

goog.require('helpim.muc.Room');

goog.require('helpim.ui');

goog.require('helpim.ui.Dialog');

goog.require('helpim.ui.muc.LobbyRoom');
goog.require('helpim.ui.muc.One2OneRoom');
goog.require('helpim.ui.muc.WaitingRoom');

/**
 * @constructor
 * @param {helpim.Client} client
 * @extends {xmpptk.ui.View}
 */
helpim.ui.Client = function(client) {
    xmpptk.ui.View.call(this, client);

    this._rooms = {};

    xmpptk.ui.emoticons.init(xmpptk.Config['static_url']);
    xmpptk.ui.sound.init(xmpptk.Config['static_url']+'xmpptk/');

    client.subscribeOnce('disconnected', function() {
        document.location.replace(xmpptk.Config['logout_redirect']);
    });

    client.subscribe('error', function(e) {
        this._logger.info(e.code);
        if (!this.subject.isConnected()) {
            // no need to show any error - it's probably about disconnecting
            return;
        }
        var dlg = new helpim.ui.Dialog('modal-dialog modal-dialog-error');
        dlg.setTitle(gettext('Error'));
        dlg.setContent('<div class="goog_dialog">'+gettext("An error occured")+'<p><small>'+helpim.ui.errorToString(e)+'</small></p></div>');
        dlg.setButtonSet(goog.ui.Dialog.ButtonSet.createOk());
        dlg.setHasTitleCloseButton(false);
        
        goog.events.listen(dlg, goog.ui.Dialog.EventType.SELECT, function(e) {
            document.location.replace(xmpptk.Config['logout_redirect']);
        });
        dlg.setVisible(true);
    }, this);

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
            var room = this._clientRoom || client.rooms[this.tabBar.getSelectedTab().getId()];

            if (goog.object.some(room.roster.get('items'), 
                                 function(occupant) {
                                     return occupant.getNick() != room['nick'] && occupant.getNick() != xmpptk.Config['bot_nick']
                                 }) && (xmpptk.Config['mode'] == 'light' || !xmpptk.Config['is_staff'] || this.tabBar.getSelectedTabIndex() > 0)) {
                var dlg = new helpim.ui.Dialog();
                dlg.setTitle(gettext('Confirm'));
                dlg.setContent('<div class="goog_dialog">'+gettext("Are you sure you want to end this conversation?")+'</div>');
                dlg.setHasTitleCloseButton(true);
                dlg.setButtonSet(goog.ui.Dialog.ButtonSet.createOkCancel());
                goog.events.listen(dlg, goog.ui.Dialog.EventType.SELECT, function(e) {
                    if (e.key == 'ok') {
                        if (goog.object.getCount(client.rooms) == 1) {
                            client.logout(true);
                        } else {
                            room.part(true);
                        }
                    }});
                dlg.setVisible(true);
            } else {
                // no need to show a dialog, just part
                if (goog.object.getCount(client.rooms) == 1) {
                    client.logout(true);
                } else {
                    room.part(true);
                }
            }
        },
        false,
        this);
    this.logoutButton.setEnabled(true);

    this.tabBar = new goog.ui.TabBar();
    this.tabBar.render(goog.dom.getElement('tabBar'));

    this._lastRoomSelected = null;

    goog.events.listen(
        this.tabBar,
        goog.ui.Component.EventType.SELECT,
        goog.bind(function(e) {
            var tabSelected = e.target;
            this._logger.info("tab selected for "+tabSelected.getId());
            var contentElement = goog.dom.getElement('tab_content');
            if (this._lastRoomSelected) {
                this._rooms[this._lastRoomSelected].show(false);
            }
            this._rooms[tabSelected.getId()].show(true);
            this._lastRoomSelected = tabSelected.getId();
            this.logoutButton.setEnabled(
                !xmpptk.Config['is_staff'] || goog.object.getCount(client.rooms) == 1 || this.tabBar.getSelectedTabIndex() > 0
            );
        }, this)
    );

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

            var dialog = new helpim.ui.Dialog('modal-dialog modal-dialog-error');
            dialog.setTitle(gettext('An error occured'));
            dialog.setContent(cond);
            dialog.setButtonSet(goog.ui.Dialog.ButtonSet.createOk());
            dialog.setHasTitleCloseButton(false);

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
            var dialog = new helpim.ui.Dialog();
            dialog.setTitle(gettext('Join Chat'));
            var content = '<div id="form_error" class="error"></div><form><div><label for="muc_nick">'+gettext('Nickname')+': </label><input id="muc_nick" maxlength="64"/></div>';
            if (xmpptk.Config['mode'] == 'light') {
                content += '<div><label for="muc_subject">'+gettext('Subject')+': </label><input id="muc_subject" maxlength="64"/></div>';
            }
            content += '</form>';
            dialog.setContent(content);
            dialog.setButtonSet(goog.ui.Dialog.ButtonSet.createOkCancel());
            dialog.setHasTitleCloseButton(false);

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

            var dialog = new helpim.ui.Dialog('modal-dialog modal-dialog-questionnaire');
            dialog.setTitle(gettext('Questionnaire'));
            dialog.setContent('<iframe width="410" height="640" src="'+params.url+'" style="border: 0px;"></iframe>');
            dialog.setButtonSet(false);
            dialog.setHasTitleCloseButton(false);

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

    var count = 0;
    goog.object.forEach(
        this.subject.rooms,
        function(room, id) {
            this._logger.info("got room with id "+id);
            if (xmpptk.Config['mode'] == 'light') {
                if (!this._rooms[id]) {
                    this._rooms[id] = new helpim.ui.muc.One2OneRoom(room);
                    this._clientRoom = room;
                }
                // nothing left to do in light mode - we don't know tabs or any other rooms
                return;
            }
            if (xmpptk.Config['is_staff']) {
                if (!this.tabBar.getChild(id)) {
                    this._logger.info("creating new room for "+id);
                    if (count == 0) {
                        // we're at the lobby
                        var tab = new goog.ui.Tab(gettext('staff'), new goog.ui.RoundedTabRenderer());
                        this._rooms[id] = new helpim.ui.muc.LobbyRoom(room, tab);
                    } else {
                        var tab = new goog.ui.Tab(gettext("waiting..."), new goog.ui.RoundedTabRenderer());
                        this._rooms[id] = new helpim.ui.muc.One2OneRoom(room, tab);
                    }
                    tab.setId(id);
                    this.tabBar.addChild(tab, true);
                    this.tabBar.setSelectedTab(tab);
                } else {
                    this._logger.info("not creating new room for "+id+" as it already exists");
                }
            } else {
                if (!this._rooms[id]) {
                    if (count == 0) {
                        this._rooms[id] = new helpim.ui.muc.WaitingRoom(room);
                        this._waitingRoom = this._rooms[id];
                    } else {
                        this._rooms[id] = new helpim.ui.muc.One2OneRoom(room);
                        this._clientRoom = room;
                        this._waitingRoom.hide();
                    }
                }
            }
            count++;
        },
        this
    );

    // remove tabs for rooms that have been left
    this.tabBar.forEachChild(
        function(tab) {
            var id = tab.getId();
            // check if id of tab (which is bound to a room) is still in list of rooms
            if (!goog.object.some(this.subject.rooms, function(room) { return id == room.id; })) {
                // not on list (this.subject.rooms)
                this.tabBar.removeChild(tab, true);
            }
        },
        this
    );

    goog.style.showElement(goog.dom.getElement('tab_content'), !goog.object.isEmpty(this.subject.rooms));
};
