goog.provide('helpim.ui.ClientRunning');

goog.require('goog.dom');
goog.require('goog.style');
goog.require('xmpptk.ui.View');

goog.require('helpim.ui.Dialog');

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

    var dialog = new helpim.ui.Dialog('modal-dialog modal-dialog-error');
    dialog.setTitle(gettext('An error occured'));
    dialog.setContent(gettext("Sorry, there's already a conversation active at some other window."));
    dialog.setButtonSet(goog.ui.Dialog.ButtonSet.createOk());
    dialog.setHasTitleCloseButton(false);
    dialog.render(goog.dom.getElement("dialog"));

    goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function(e) {
        document.location.replace(xmpptk.Config['logout_redirect']);
    });

    dialog.setVisible(true);
};
goog.inherits(helpim.ui.ClientRunning, xmpptk.ui.View);

