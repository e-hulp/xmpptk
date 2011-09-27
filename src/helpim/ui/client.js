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

    client.subscribeOnce(
        helpim.Client.NS.HELPIM_ROOMS+'#resultIQ',
        function() {
			try {
            var dialog = new goog.ui.Dialog();
            dialog.setTitle(gettext('Please wait!'));
            dialog.setContent('<div class="goog_dialog">'+gettext("Please wait while we're acquiring a room for you! This can take some time.")+'</div><div class="ajax-loader"><img src="'+helpim.ui.getStatic('/helpim/ajax-loader.gif')+'"/></div>');
            dialog.setHasTitleCloseButton(false);
			dialog.setButtonSet(null);
            dialog.render(goog.dom.getElement("dialog"));
			dialog.setVisible(true);
			} catch(e) { console.error(e); }
        },
        this
    );

    client.subscribeOnce(
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
            if (!this.tabBar.getChild(id)) {
                this._rooms[id] = new helpim.ui.muc.Room(room);
				var title = (count == 0)? gettext('lobby'):""+count;
                var tab = new goog.ui.Tab(title, new goog.ui.RoundedTabRenderer());
                tab.setId(id);
                this.tabBar.addChild(tab, true);
                this.tabBar.setSelectedTab(tab);
				count++;
            }
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
