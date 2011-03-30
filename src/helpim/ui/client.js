goog.provide('helpim.ui.Client');

goog.require('goog.dom');
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

    var EVENTS = goog.object.getValues(goog.ui.Component.EventType);
    this._logger.fine('Listening for: ' + EVENTS.join(', ') + '.');
 
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

    goog.events.listen(
        this.tabBar,
        goog.ui.Component.EventType.SELECT,
        function(e) {
            var tabSelected = e.target;
            var contentElement = goog.dom.getElement('tab_content');
            goog.dom.setTextContent(contentElement,
                                    'You selected the "' + tabSelected.getCaption() + '" tab.');
        });
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
    goog.array.forEach(
        this.subject.rooms,
        function(room) {
            if (!this.tabBar.getChild(room.id)) {
                var tab = new goog.ui.Tab(room.id, new goog.ui.RoundedTabRenderer());
                tab.setId(room.id);
                this.tabBar.addChild(tab, true);
            }
        },
        this
    );
    this.tabBar.forEachChild(
        function(tab) {
            var id = tab.getId();
            if (!goog.array.some(this.subject.rooms, function(room) { return id == room.id; })) {
                this.tabBar.removeChild(tab, true);
            }
        },
        this
    );

    goog.style.showElement(goog.dom.getElement('tab_content'), this.subject.rooms.length>0);
};
