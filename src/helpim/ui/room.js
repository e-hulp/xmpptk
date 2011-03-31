goog.provide('helpim.ui.Room');

goog.require('goog.debug.Logger');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.ui.Textarea');
goog.require('goog.ui.TextareaRenderer');

goog.require('xmpptk.ui');
goog.require('xmpptk.ui.View');

helpim.ui.Room = function(room) {
    xmpptk.ui.View.call(this, room);

    this._logger.info("creating view for room with id "+room.id);

    this._panel = goog.dom.getElement('panelTemplate').cloneNode(true);
    this._panel.id = xmpptk.ui.fixID(room.id + "_roomPanel");
    
    var contentPanel = goog.dom.getElement('tab_content');
    goog.dom.appendChild(contentPanel, this._panel);

    this._subjectPanel  = goog.dom.getElementByClass('subjectPanel', this._panel);
    this._messagesPanel = goog.dom.getElementByClass('messagesPanel', this._panel);
    this._sendTextarea = new goog.ui.Textarea("Type here to send a message");
    this._sendTextarea.render(goog.dom.getElementByClass('sendTextarea', this._panel));
    this._sendTextarea._firstClick = true;    
    goog.events.listen(
        this._sendTextarea.getContentElement(),
        goog.events.EventType.CLICK,
        goog.bind(function(e) {
            if (this._sendTextarea._firstClick) {
                this._sendTextarea.setValue('');
                this._sendTextarea._firstClick = false;
            }
        }, this)
    );
    goog.events.listen(
        this._sendTextarea.getContentElement(),
        goog.events.EventType.KEYPRESS,
        goog.bind(function(e) {
            this._logger.info(e.charCode);
            this._logger.info(this._sendTextarea.getValue());
            if (e.charCode == 13) { // return key
                try {
                    room.sendMessage(this._sendTextarea.getValue());
                    this._sendTextarea.setValue('');
                    e.preventDefault();
                } catch(e) { this._logger.severe("failed sending message", e); }
            }
        }, this)
    );
    this._messagesAt = 0;
};
goog.inherits(helpim.ui.Room, xmpptk.ui.View);

helpim.ui.Room.prototype._logger = goog.debug.Logger.getLogger('helpim.ui.Room');

helpim.ui.Room.prototype.getPanel = function() {
    return this._panel;
};

helpim.ui.Room.prototype.formatMessage = function(oMsg) {
    return '&lt;'+xmpptk.ui.htmlEnc(oMsg.getFromJID().getResource())+'&gt; '+
        xmpptk.ui.msgFormat(oMsg.getBody());
    
};

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

    for (var l=this.subject.messages.length; this._messagesAt<l;this._messagesAt++) {
        var roomMessage = goog.dom.createDom('div', {class:'roomMessage'});
        roomMessage.innerHTML = this.formatMessage(this.subject.messages[this._messagesAt]);
        goog.dom.appendChild(this._messagesPanel, roomMessage);
    }
};