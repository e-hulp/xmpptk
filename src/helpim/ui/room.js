goog.provide('helpim.ui.Room');

goog.require('xmpptk.ui.View');

helpim.ui.Room = function(room) {
    xmpptk.ui.View.call(this, room);

    this._panel = goog.dom.getElement('panelTemplate').cloneNode(true);
    this._panel.id = room.jid + "_roomPanel";
    var contentPanel = goog.dom.getElement('tab_content');
    goog.dom.appendChild(contentPanel, this._panel);
};
goog.inherits(helpim.ui.Room, xmpptk.ui.View);

helpim.ui.Room.prototype.update = function() {
    goog.dom.setTextContent(
        goog.dom.getElementByClass('roomSubject', this._panel),
        this.subject.subject
    );
};