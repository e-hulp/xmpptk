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

    var logoutButton = new goog.ui.Button(gettext('Stop Conversation'),
                                          goog.ui.FlatButtonRenderer.getInstance());
    logoutButton.render(goog.dom.getElement('logoutButton'));
    logoutButton.setValue('logout');
    goog.events.listen(
        logoutButton,
        goog.ui.Component.EventType.ACTION,
        function() {
            client.logoutCleanExit();
        },
        false,
        this);

    this.tabBar = new goog.ui.TabBar();
    this.tabBar.render(goog.dom.getElement('tabBar'));

    client.subscribe(
        helpim.Client.NS.HELPIM_ROOMS+'#errorIQ',
        function(cond) {

            /* known conditions are:
             * - service-unavailable -> bot is down
             * - bad-request         -> bad xml was sent (hu?)
             * - item-not-found      -> no room available
             * - not-authorized      -> token sent was invalid
             */

            switch(cond) {
            case 'service-unavailable':
                cond = 'Service not available';
                break;
            case 'bad-request':
                cond = 'Bad Request';
                break;
            case 'item-not-found':
                if (xmpptk.Config['is_staff']) {
                    document.location.replace(xmpptk.Config['logout_redirect']);
                } else {
                    document.location.replace(xmpptk.Config['unavailable_redirect']);
                }
                return;
                break;
            case 'not-authorized':
                cond = gettext("Sorry, you're not allowed to access this service");
                break;
            }

            var dialog = new goog.ui.Dialog();
            dialog.setTitle(gettext('An error occured'));
            dialog.setContent(cond);
            dialog.setButtonSet(goog.ui.Dialog.ButtonSet.createOk());
            dialog.setHasTitleCloseButton(false);
            dialog.render(goog.dom.getElement("dialog"));

            goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function(e) {
                client.logout();
            });

            dialog.setVisible(true);
        }
    );

    client.subscribe(
        'nick_required',
        function(callback) {
            var dialog = new goog.ui.Dialog();
            dialog.setTitle(gettext('Join Chat'));
            dialog.setContent('<div id="form_error" class="error"></div><form><div><label for="muc_nick">'+gettext('Nickname')+': </label><input id="muc_nick" maxlength="64"/></div><div><label for="muc_subject">'+gettext('Subject')+': </label><input id="muc_subject" maxlength="64"/></div></form>');
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
                    callback(nick, goog.dom.getElement('muc_subject').value);
                } else {
                    client.logout();
                }
            }, false, this);
            dialog.setVisible(true);
            goog.dom.getElement('muc_nick').focus();
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
    var count = 0;
    goog.object.forEach(
        this.subject.rooms,
        function(room, id) {
            if (xmpptk.Config['is_staff']) {
                if (!this.tabBar.getChild(id)) {
                    this._logger.info("creating new room for "+id);
                    this._rooms[id] = new helpim.ui.muc.Room(room);
                    var title = (count == 0)? gettext('lobby'):""+count;
                    var tab = new goog.ui.Tab(title, new goog.ui.RoundedTabRenderer());
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
                    this._rooms[id] = new helpim.ui.muc.Room(room);
                    if (this._waitingdialog) {
                        this._logger.info("hiding waiting dialog");
                        this._waitingdialog.setVisible(false);
                    } else {
                        this._logger.info("nothing to hide");
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
