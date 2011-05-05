goog.provide('helpim.ui.Room');

goog.require('goog.debug.Logger');
goog.require('goog.style');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.ui.Textarea');
goog.require('goog.ui.TextareaRenderer');

goog.require('xmpptk.ui');
goog.require('xmpptk.ui.View');

/**
 * View for a muc room.
 * @param {xmpptk.muc.Room} room a room object
 * @constructor
 * @extends {xmpptk.ui.View}
 */
helpim.ui.Room = function(room) {
    xmpptk.ui.View.call(this, room);

    this._logger.info("creating view for room with id "+room.id);

    this._panel = goog.dom.getElement('panelTemplate').cloneNode(true);
    this._panel.id = xmpptk.ui.fixID(room.id + "_roomPanel");

    var contentPanel = goog.dom.getElement('tab_content');
    goog.dom.appendChild(contentPanel, this._panel);

    this._subjectPanel  = goog.dom.getElementByClass('subjectPanel', this._panel);
    this._messagesPanel = goog.dom.getElementByClass('messagesPanel', this._panel);
    this._rosterPanel = goog.dom.getElementByClass('rosterPanel', this._panel);
    this._sendTextarea = new goog.ui.Textarea("Type here to send a message");
    this._sendTextarea.decorate(goog.dom.getElementByClass('sendTextarea', this._panel));
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
            if (e.charCode == 13) { // return key
                try {
                    this._logger.info(this._sendTextarea.getValue());
                    room.sendMessage(this._sendTextarea.getValue());
                    this._sendTextarea.setValue('');
                    e.preventDefault();
                } catch(e) { this._logger.severe("failed sending message", e); }
            } else {
                room.sendComposing();
            }
        }, this)
    );
    this._messagesAt = 0;
    this._eventsAt = 0;

    if (xmpptk.Config['mode'] == 'light') {
        // sir hide-a-lot
        goog.style.showElement(this._rosterPanel, false);
        goog.style.showElement(this._subjectPanel, false);
        goog.style.setStyle(this._messagesPanel, 'margin-right', '0');
        goog.style.setStyle(goog.dom.getElementByClass('sendPanel', this._panel), 'margin-right', '0');
    }
};
goog.inherits(helpim.ui.Room, xmpptk.ui.View);

helpim.ui.Room.prototype._logger = goog.debug.Logger.getLogger('helpim.ui.Room');

helpim.ui.Room.prototype.appendMessage = function(html, extraClasses, id) {
    var classes = 'roomMessage';
    if (goog.isString(extraClasses)) {
        classes += ' ' + extraClasses;
    }
    var roomMessage = goog.dom.createDom('div', {'class':classes});
    if (id) {
        roomMessage.id = id;
    }
    roomMessage.innerHTML = html;
    goog.dom.appendChild(this._messagesPanel, roomMessage);
}

helpim.ui.Room.prototype.getPanel = function() {
    return this._panel;
};

helpim.ui.Room.prototype.formatMessage = function(msg) {
    return '&lt;'+xmpptk.ui.htmlEnc(msg['from'])+'&gt; '+
        xmpptk.ui.msgFormat(msg['body']);
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
        this.appendMessage(this.formatMessage(this.subject.messages[this._messagesAt]));
    }

    for (var l=this.subject.events.length; this._eventsAt<l; this._eventsAt++) {
        var event = this.subject.events[this._eventsAt];

        if (event['from'] != xmpptk.Config['bot_nick']) {
            var html = '';
            switch (event['type']) {
            case 'occupant_joined':
                html = event['from'] + " has joined";
                break;
            case 'occupant_left':
                html = event['from'] + " has left";
                break;
            }
            this.appendMessage(html, 'roomEvent');
        } else {
            this._logger.info("not showing events from bot");
        }
    }

    goog.object.forEach(
        this.subject.chatStates,
        function(state, from) {
            this._logger.info("chat state > "+from +":"+state);
            var id = xmpptk.ui.fixID(this.subject.id+from+"_composingMessage");
            var el = goog.dom.getElement(id);
            try {
                switch (state) {
                case '':
                case 'active':
                    goog.dom.removeNode(el);
                    break;
                case 'paused':
                        goog.dom.setTextContent(el, from+" stopped composing");
                    break;
                case 'composing':
                    var msg = from + " is composing a message";
                    if (el) {
                        goog.dom.setTextContent(el, msg);
                    } else {
                        this.appendMessage(
                            msg,
                            "composingMessage",
                            id);
                    }
                }
            } catch(e) { this._logger.severe("failed show chat state", e); }
        },
        this
    );

    goog.dom.removeChildren(this._rosterPanel);
    goog.object.forEach(
        this.subject.roster.getItems(),
        function(item) {
            if (item.role == xmpptk.muc.Occupant.Role.NONE) {
                return;
            }
            goog.dom.append(
                this._rosterPanel,
                goog.dom.createDom('div',
                                   {'class': 'rosterItem'},
                                   (new JSJaCJID(item['jid'])).getResource())
            );
        },
        this
    );
};