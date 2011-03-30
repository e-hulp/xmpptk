goog.provide('helpim.ui.Client');

goog.require('goog.dom');
goog.require('goog.object');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Button');
goog.require('goog.ui.TabBar');
goog.require('goog.ui.Tab');
goog.require('goog.ui.RoundedTabRenderer');

goog.require('xmpptk.ui.View');

/**
 * @constructor
 * @param {helpim.Client} client
 */
helpim.ui.Client = function(client) {
    xmpptk.ui.View.call(this, client);

    this._rooms = {};
 
    var logInOutButton = new goog.ui.Button();
    logInOutButton.decorate(goog.dom.getElement('logInOutButton'));
    goog.events.listen(
        logInOutButton,
        goog.ui.Component.EventType.ACTION,
        function() {
            if (logInOutButton.getValue() == 'logout') {
                logInOutButton.setValue('login');
                client.logout();
            } else {
                logInOutButton.setValue('logout');
                client.login();
            }
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
