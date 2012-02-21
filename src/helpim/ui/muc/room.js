goog.provide('helpim.ui.muc.Room');

goog.require('goog.debug.Logger');
goog.require('goog.style');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.ui.Textarea');
goog.require('goog.ui.TextareaRenderer');
goog.require('goog.fx.dom.FadeInAndShow');
goog.require('goog.fx.dom.FadeOutAndHide');

goog.require('xmpptk.ui');
goog.require('xmpptk.ui.View');
goog.require('xmpptk.ui.sound');

/**
 * View for a muc room.
 * @param {xmpptk.muc.Room} room a room object
 * @constructor
 * @extends {xmpptk.ui.View}
 */
helpim.ui.muc.Room = function(room) {
    this._logger.info("Creating view for room with id "+room.id);
    xmpptk.ui.View.call(this, room);

    this._render();

    this.subject.attachPropertyhandler('subject', this._subjectChanged, this);
    this.subject.attachPropertyhandler('chatStates', this._chatStatesChanged, this);

    this.subject.subscribe('message', this._messageReceived, this);

    this.subject.subscribe('occupant_joined', this._occupantJoined, this);
    this.subject.subscribe('occupant_left',   this._occupantLeft,   this);
};
goog.inherits(helpim.ui.muc.Room, xmpptk.ui.View);

/**
 * Appends message to chat window
 * @param {Object} message with properties
 *   body (string) the message body
 *   className (string) optional css class to add
 *   id (string) optional id if message element
 * @notypecheck
 */
helpim.ui.muc.Room.prototype.appendMessage = function(message) {
    var classes = 'roomMessage';
    if (goog.isString(message.className)) {
        classes += ' ' + message.className;
    }
    var roomMessage = goog.dom.createDom('div', {'class':classes});
    if (message.id) {
        roomMessage.id = message.id;
    }
    roomMessage.innerHTML = message.body;

    var scrollBottom = this._messagesPanel.scrollTop+this._messagesPanel.clientHeight>=this._messagesPanel.scrollHeight;
    this._logger.info("scrollBottom: "+scrollBottom);

    goog.dom.appendChild(this._messagesPanel, roomMessage);
    if (scrollBottom) {
        this._messagesPanel.scrollTop = this._messagesPanel.scrollHeight;
    }
}

/**
 * determine the css class for coloring a nickname
 * @param {string} nick the nick name to lookup a color for
 * @return {string} the name of the color to be used
 */
helpim.ui.muc.Room.prototype.getNickColor = function(nick) {
    return helpim.ui.getNickColor(nick);
};

/**
 * return the panel element
 */
helpim.ui.muc.Room.prototype.getPanel = function() {
    return this._panel;
};

/**
 * format a message
 * @param {{type: string, body: string, from: string}}
 * @return {{body: string, className: string}}
 * @notypecheck
 */
helpim.ui.muc.Room.prototype.formatMessage = function(msg) {
    console.log(msg);
    if (msg.type != 'groupchat') {
        // this is a private message presumably from bot - maybe better check this TODO
        return {body:xmpptk.ui.msgFormat(msg.body), className: 'private_message'};
    } else {
        if (msg.delay) {
            var ts = Date.jab2date(msg.delay);
            ts = '@'+ts.toLocaleTimeString();
        } else {
            var ts = '@'+(new Date().toLocaleTimeString());
        }
        var meMatches = msg.body.match(/^\/me (.*)$/);
        if (meMatches) {
            return {body:'* ' + xmpptk.ui.htmlEnc(msg.from)+ ' ' +
                    xmpptk.ui.msgFormat(meMatches[1]) + ' *',
                    className:'me_message'};
        } else {
            return {body:'<span title="'+ts+'" style="color:'+this.getNickColor(msg.from)+';">&lt;'+xmpptk.ui.htmlEnc(msg.from)+'&gt;</span> '+ xmpptk.ui.msgFormat(msg.body),
                    className:'groupchat_message'};
        }
    }
};

helpim.ui.muc.Room.prototype.update = function() {};

helpim.ui.muc.Room.prototype._chatStatesChanged = function(chatStates) {
    goog.object.forEach(
        chatStates,
        function(state, from) {
            if (from == this.subject['nick']) {
                return;
            }
            this._logger.info("chat state from "+from +":"+state);
            var id = xmpptk.ui.fixID(this.subject.id+from+"_composingMessage");
            var el = goog.dom.getElement(id);
            try {
                switch (state) {
                case '':
                case 'active':
                    goog.dom.removeNode(el);
                    break;
                case 'paused':
                    goog.dom.setTextContent(el, interpolate(gettext("%s stopped composing"), [from]));
                    break;
                case 'composing':
                    var msg = interpolate(gettext("%s is composing a message"), [from]);
                    if (el) {
                        goog.dom.setTextContent(el, msg);
                    } else {
                        this.appendMessage(
                            {body: xmpptk.ui.htmlEnc(msg),
                             className: "composingMessage",
                             id: id});
                    }
                }
            } catch(e) { this._logger.severe("failed show chat state", e.message); }
        },
        this
    );
};

helpim.ui.muc.Room.prototype._logger = goog.debug.Logger.getLogger('helpim.ui.muc.Room');

/**
 * @param {{body: string, type:string, from:string}} message the message recieved
 */
helpim.ui.muc.Room.prototype._messageReceived = function(message) {
    this.appendMessage(this.formatMessage(message));
    if (message['from'] != this.subject['nick']) {
        if (xmpptk.Config['is_staff']) {
            xmpptk.ui.sound.play('chat_recv');
        } else {
            xmpptk.ui.sound.play('ping_client');
        }
        if (this._tab && !this._tab.isSelected()) {
            this._tab.setHighlighted(true);
        }
    }
};

/**
 * @param {{from: string, status: string}} event the event recieved
 */
helpim.ui.muc.Room.prototype._occupantJoined = function(event) {
    if (!goog.array.contains([this.subject['nick'], xmpptk.Config['bot_nick']], event.from)) {
        this.appendMessage({body: interpolate(gettext("%s has entered the conversation"), [xmpptk.ui.htmlEnc(event.from)]), className:'roomEvent'});
    }
};

/**
 * @param {{from: string, status: string}} event the event recieved
 */
helpim.ui.muc.Room.prototype._occupantLeft = function(event) {
    if (goog.array.contains([this.subject['nick'], xmpptk.Config['bot_nick']], event.from)) {
        return;
    }
    var msg = interpolate(gettext("%s has disappeared from the conversation"), [xmpptk.ui.htmlEnc(event.from)]);
    if (event.status != '') {
        if (event.status == 'Clean Exit') {
            msg = interpolate(gettext("%s has ended the conversation"), [xmpptk.ui.htmlEnc(event.from)]);
        } else {
            msg += " ("+xmpptk.ui.htmlEnc(event.status)+")";
        }
    }
    this.appendMessage({body:msg, className:'roomEvent'});
};

helpim.ui.muc.Room.prototype._render = function() {
    this._logger.info("rendering room view");
    this._panel = goog.dom.getElement('panelTemplate').cloneNode(true);
    this._panel.id = xmpptk.ui.fixID(this.subject.id + "_roomPanel");

    var contentPanel = goog.dom.getElement('tab_content');
    goog.dom.appendChild(contentPanel, this._panel);

    this._subjectPanel  = goog.dom.getElementByClass('subjectPanel', this._panel);
    this._messagesPanel = goog.dom.getElementByClass('messagesPanel', this._panel);
    this._rosterPanel = goog.dom.getElementByClass('rosterPanel', this._panel);
    this._sendTextarea = new goog.ui.Textarea();
    this._sendTextarea.decorate(goog.dom.getElementByClass('sendTextarea', this._panel));
    this._sendTextareaElement = goog.dom.getElementByClass('sendTextarea', this._panel);

    this.subject.subscribeOnce(
        'admitted',
        goog.bind(function() {
            goog.style.showElement(goog.dom.getElement('helpimClient'), true);
        }, this)
    );

    goog.events.listen(
        this._sendTextareaElement,
        goog.events.EventType.KEYPRESS,
        goog.bind(function(e) {
            if (e.charCode == 13) { // return key
                try {
                    this._logger.info(this._sendTextarea.getValue());
                    this.subject.sendMessage(this._sendTextarea.getValue());
                    this._sendTextarea.setValue('');
                    e.preventDefault();
                } catch(err) { this._logger.severe("failed sending message", err.message); }
            } else {
                if (!e.ctrlKey && !e.metaKey) {
                    this.subject.sendComposing();
                }
            }
        }, this)
    );

    var emoticonsPanel = goog.dom.getElementByClass('emoticonsPanel', this._panel);
    var seenEmoticon = {};
    var numEmoticonsProcessed = 0;
    this._logger.info("creating emoticonsPanel");
    goog.object.forEach(
        xmpptk.ui.emoticons.replacements,
        function(replacement, key) {
            var img = new Image();
            img.src = replacement.icon.src;

            if (seenEmoticon[img.src]) {
                return;
            }
            seenEmoticon[img.src] = true;
            img.title = key;
            img.className = 'emoticonBtn';

            numEmoticonsProcessed++;
            if (numEmoticonsProcessed==10) {
                var oldEmoticonsPanel = emoticonsPanel;
                emoticonsPanel = goog.dom.createElement('span');
                goog.dom.appendChild(oldEmoticonsPanel, emoticonsPanel);
                goog.style.showElement(emoticonsPanel, false);
                var plus = goog.dom.createElement('span');
                plus.className = 'emoticonsExpandBtn';
                plus.title = gettext('Click to see even more emoticons');
                goog.dom.appendChild(plus, goog.dom.createTextNode(' '+gettext('more')+' >'));
                goog.dom.appendChild(oldEmoticonsPanel, plus);
                plus.shown = false;
                goog.events.listen(
                    plus,
                    goog.events.EventType.CLICK,
                    function(e) {
                        this._logger.info('click');
                        if (plus.shown) {
                            plus.innerHTML = ' '+gettext('more')+' &gt;';
                            plus.title = gettext('Click to see even more emoticons');
                            (new goog.fx.dom.FadeOutAndHide(emoticonsPanel, 200)).play();
                        } else {
                            plus.innerHTML = '&lt; '+gettext('less')+' ';
                            plus.title = gettext('Click to collapse emoticons');
                            (new goog.fx.dom.FadeInAndShow(emoticonsPanel, 200)).play();
                        }
                        plus.shown = !plus.shown;
                    },
                    false,
                    this
                );
            }

            goog.dom.appendChild(emoticonsPanel, img);

            goog.events.listen(
                img,
                goog.events.EventType.CLICK,
                function(e) {
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

                    var input = this._sendTextareaElement;
                    if (input.setSelectionRange) {
                        var selectionStart = input.selectionStart;
                        var selectionEnd = input.selectionEnd;
                        if (input.value.charAt(input.selectionStart-1) != ' ' && input.value.charAt(input.selectionStart-1) != '') {
                            emoticon = ' ' + emoticon;
                        }
                        input.value = input.value.substring(0, selectionStart) + emoticon + input.value.substring(selectionEnd);
                        if (selectionStart != selectionEnd) { // has there been a selection
                            setSelectionRange(input, selectionStart, selectionStart + emoticon.length);
                        }
                        else { // set caret
                            setSelectionRange(input, selectionStart + emoticon.length, selectionStart + emoticon.length);
                        }
                    }
                    else if (input.caretPos) {
                        var caretPos = input.caretPos;
                        caretPos.text = (caretPos.text.charAt(caretPos.text.length - 1)==' '?emoticon+' ':emoticon);
                        input.focus();
                    }
                    else {
                        if (input.value.length && input.value.charAt(input.value.length) != ' ') {
                            input.value += ' ';
                        }
                        input.value += emoticon;
                        input.focus();
                    }
                },
                false,
                this
            );
        },
        this
    );

    goog.style.showElement(this._subjectPanel, false);
};

helpim.ui.muc.Room.prototype._subjectChanged = function(roomSubject) {
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
};
