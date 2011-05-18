goog.provide('helpim.ui.Client');

goog.require('goog.dom');
goog.require('goog.object');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Button');
goog.require('goog.ui.FlatButtonRenderer');
goog.require('goog.ui.TabBar');
goog.require('goog.ui.Tab');
goog.require('goog.ui.RoundedTabRenderer');

goog.require('xmpptk.ui.View');
goog.require('xmpptk.ui.emoticons');
goog.require('xmpptk.ui.sound');

/**
 * @constructor
 * @param {helpim.Client} client
 */
helpim.ui.Client = function(client) {
    xmpptk.ui.View.call(this, client);

    this._rooms = {};

    xmpptk.ui.emoticons.init(xmpptk.Config['static_url']);
    xmpptk.ui.sound.init(xmpptk.Config['static_url']);

    goog.events.listen(
        goog.dom.getElement('soundButton'),
        goog.events.EventType.CLICK,
        function(e) {
            if (xmpptk.ui.sound.enabled) {
                e.target.src = '/static/images/stock_volume-mute.png';
            } else {
                e.target.src = '/static/images/stock_volume.png';
            }
            xmpptk.ui.sound.enabled = !xmpptk.ui.sound.enabled;
        }
    );
 
    var logoutButton = new goog.ui.Button('logout', 
                                            goog.ui.FlatButtonRenderer.getInstance());
    logoutButton.render(goog.dom.getElement('logoutButton'));
    logoutButton.setValue('logout');
    goog.events.listen(
        logoutButton,
        goog.ui.Component.EventType.ACTION,
        function() {
            client.logout(function() {
                document.location.replace(xmpptk.Config['logout_redirect']);
            });
        },
        false,
        this);

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
    goog.object.forEach(
        this.subject.rooms,
        function(room) {
            if (!this.tabBar.getChild(room.id)) {
                this._rooms[room.id] = new helpim.ui.Room(room);

                var tab = new goog.ui.Tab(room.id, new goog.ui.RoundedTabRenderer());
                tab.setId(room.id);
                this.tabBar.addChild(tab, true);
                this.tabBar.setSelectedTab(tab);
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
