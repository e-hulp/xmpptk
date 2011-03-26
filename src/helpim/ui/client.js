goog.provide('helpim.ui.Client');

goog.require('goog.ui.Button');
goog.require('goog.ui.Component.EventType');

goog.require('xmpptk.ui.View');

/**
 * @constructor
 * @param {helpim.Client} client
 */
helpim.ui.Client = function(client) {
    xmpptk.ui.View.call(this, client);

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
};
goog.inherits(helpim.ui.Client, xmpptk.ui.View);