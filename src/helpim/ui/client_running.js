goog.provide('helpim.ui.ClientRunning');

goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.ui.Dialog');
goog.require('xmpptk.ui.View');

/**
 * @constructor
 * @param {helpim.Client} client
 * @extends {xmpptk.ui.View}
 */
helpim.ui.ClientRunning = function(client) {
    xmpptk.ui.View.call(this, client);

    goog.style.showElement(
        goog.dom.getElement('helpimClient'),
        false
    );

    var dialog = new goog.ui.Dialog();
    dialog.setTitle('An error occured');
    dialog.setContent("Sorry, there's already a conversation active at some other window.");
    dialog.setButtonSet(goog.ui.Dialog.ButtonSet.createOk());
    dialog.setHasTitleCloseButton(false);
    dialog.render(goog.dom.getElement("dialog"));

    goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function(e) {
        document.location.replace(xmpptk.Config['logout_redirect']);
    });

    dialog.setVisible(true);
};
goog.inherits(helpim.ui.ClientRunning, xmpptk.ui.View);

