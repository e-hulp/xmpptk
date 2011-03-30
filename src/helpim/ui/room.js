goog.provide('helpim.ui.Room');

goog.require('xmpptk.ui.View');

helpim.ui.Room = function(room) {
    xmpptk.ui.View.call(this, room);

    this._panel = goog.dom.getElement('panelTemplate').cloneNode(true);
    this._panel.id = room.jid + "_roomPanel";
    
    var contentPanel = goog.dom.getElement('tab_content');
    goog.dom.appendChild(contentPanel, this._panel);

    this._subjectPanel  = goog.dom.getElementByClass('subjectPanel', this._panel);
    this._messagesPanel = goog.dom.getElementByClass('messagesPanel', this._panel);

    this._messagesAt = 0;
};
goog.inherits(helpim.ui.Room, xmpptk.ui.View);

helpim.ui.Room.prototype.update = function() {
    if (this.subject.subject != '') {
        goog.style.showElement(this._subjectPanel, true);
        goog.dom.setTextContent(
            goog.dom.getElementByClass('roomSubject', this._panel),
            this.subject.subject
        );
    } else {
        goog.style.showElement(this._subjectPanel, false);
    }

    if (this._messagesAt < this.subject.messages.length) {
        // we got new messages to display
        
        for (var l=this.subject.messages.length; this._messagesAt<l;this._messagesAt++) {
            goog.dom.appendChild(
                this._messagesPanel, 
                goog.dom.createDom('div', {class:'roomMessage'}, this.subject.messages[this._messagesAt].getBody())
            );
        }
    }

};

helpim.ui.Room.prototype.getPanel = function() {
    return this._panel;
};