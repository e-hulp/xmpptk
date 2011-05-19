goog.provide('helpim.ui.Room');

goog.require('goog.debug.Logger');
goog.require('goog.style');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.ui.Textarea');
goog.require('goog.ui.TextareaRenderer');

goog.require('xmpptk.ui');
goog.require('xmpptk.ui.View');
goog.require('xmpptk.ui.sound');

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
                } catch(e) { this._logger.severe("failed sending message", e.message); }
            } else {
                room.sendComposing();
            }
        }, this)
    );
    var emoticonsPanel = goog.dom.getElementByClass('emoticonsPanel', this._panel);
    var seenEmoticon = {};
    this._logger.info("creating emoticonsPanel");
    goog.object.forEach(
        xmpptk.ui.emoticons.replacements,
        goog.bind(function(replacement, key) {
            var img = replacement.icon;
            if (seenEmoticon[img.src]) {
                return;
            }
            seenEmoticon[img.src] = true;
            img.title = key;
            img.className = 'emoticonBtn';

            emoticonsPanel.appendChild(img);

            goog.events.listen(
                img,
                goog.events.EventType.CLICK,
                goog.bind(function(e) {
                    if (this._sendTextarea._firstClick) {
                        this._sendTextarea.setValue('');
                        this._sendTextarea._firstClick = false;
                    }

                    var emoticon = e.target.title;

                    var setSelectionRange = function(input, selectionStart, selectionEnd) {
                        if (input.setSelectionRange) {
                            input.focus();
                            input.setSelectionRange(selectionStart, selectionEnd);
                        }
                        else if (input.createTextRange) {
                            var range = input.createTextRange();
                            range.collapse(true);
                            range.moveEnd('character', selectionEnd);
                            range.moveStart('character', selectionStart);
                            range.select();
                        }
                    };

                    input = this._sendTextarea.getContentElement();
                    if (input.setSelectionRange) {
                        var selectionStart = input.selectionStart;
                        var selectionEnd = input.selectionEnd;
                        input.value = input.value.substring(0, selectionStart) + emoticon + input.value.substring(selectionEnd);
                        if (selectionStart != selectionEnd) { // has there been a selection
                            setSelectionRange(input, selectionStart, selectionStart + emoticon.length);
                        }
                        else { // set caret
                            setSelectionRange(input, selectionStart + emoticon.length, selectionStart + emoticon.length);
                        }
                    }
                    else if (input.createTextRange && input.caretPos) {
                        var caretPos = input.caretPos;
                        caretPos.text = (caretPos.text.charAt(caretPos.text.length - 1)==' '?emoticon+' ':emoticon);
                        input.focus();
                    }
                    else {
                        input.value += emoticon;
                        input.focus();
                    }


                }, this)
            );
        }, this)
    );

    this._messagesAt = 0;
    this._eventsAt = 0;

    if (xmpptk.Config['is_one2one']) {
        // sir hide-a-lot
        goog.style.showElement(this._rosterPanel, false);
        goog.style.setStyle(this._messagesPanel, 'margin-right', '0');
        goog.style.setStyle(goog.dom.getElementByClass('sendPanel', this._panel), 'margin-right', '0');
    }

    goog.style.showElement(this._subjectPanel, false);

    this._focused = true;
    window.onblur = goog.bind(function() { this._focused = false; }, this);
    window.onfocus = goog.bind(function() { this._focused = true; }, this);
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

    var scrollBottom = this._messagesPanel.scrollTop+this._messagesPanel.clientHeight>=this._messagesPanel.scrollHeight;
    this._logger.info("scrollBottom: "+scrollBottom);

    goog.dom.appendChild(this._messagesPanel, roomMessage);
    if (scrollBottom) {
        this._messagesPanel.scrollTop = this._messagesPanel.scrollHeight;
    }
}

helpim.ui.Room.prototype.getPanel = function() {
    return this._panel;
};

helpim.ui.Room.prototype.formatMessage = function(msg) {
    return '&lt;'+xmpptk.ui.htmlEnc(msg['from'])+'&gt; '+
        xmpptk.ui.msgFormat(msg['body']);
};

helpim.ui.Room.prototype.update = function() {
    this._logger.info("update called");

    var roomSubject = this.subject.subject;
    if (xmpptk.Config['is_staff'] && roomSubject != '') {
        this._logger.info('showing subject: '+roomSubject);
        goog.style.showElement(this._subjectPanel, true);
        goog.dom.setTextContent(
            goog.dom.getElementByClass('roomSubject', this._panel),
            roomSubject
        );
    } else {
        this._logger.info('hiding subject');
        goog.style.showElement(this._subjectPanel, false);
    }

    for (var l=this.subject.messages.length; this._messagesAt<l;this._messagesAt++) {
        this.appendMessage(this.formatMessage(this.subject.messages[this._messagesAt]));
        if (this.subject.messages[this._messagesAt]['from'] != this.subject['nick']) {
            xmpptk.ui.sound.play('chat_recv');
        }
    }

    for (var l=this.subject.events.length; this._eventsAt<l; this._eventsAt++) {
        var event = this.subject.events[this._eventsAt];
        this._logger.info("handling event "+event['type']+" for "+event['from']);
        if (event['from'] != xmpptk.Config['bot_nick']) {
            var html = '';
            switch (event['type']) {
            case 'occupant_joined':
                html = event['from'] + " has joined";
                if (event['from'] != this.subject['nick']) {
                    if (!this._focused) {
                        window.focus();
                    }
                    // taken from
                    // http://stackoverflow.com/questions/37122/make-browser-window-blink-in-task-bar
                    // combined with
                    // http://stackoverflow.com/questions/4257936/window-onmousemove-in-ie-and-firefox
                    var oldTitle = document.title;
                    var msg = "Ring! Ring!";
                    var timeoutId = setInterval(function() {
                        document.title = document.title == msg ? ' ' : msg;
                    }, 1000);
                    document.onmousemove = function() {
                        clearInterval(timeoutId);
                        document.title = oldTitle;
                        document.onmousemove = null;
                    };
                    xmpptk.ui.sound.play('ring');
                }
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
            this._logger.info(this.subject['nick']);
            if (from == this.subject['nick']) {
                this._logger.info("skipping my own chat state")
                return;
            }
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
            } catch(e) { this._logger.severe("failed show chat state", e.message); }
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