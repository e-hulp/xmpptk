var JSJaC = function() {};
JSJaC.bind = function(fun, obj) {};

var JSJaCHttpBindingConnection = function() {};
JSJaCHttpBindingConnection.prototype.registerHandler = function(event, handler) {};
JSJaCHttpBindingConnection.prototype.registerIQSet = function(child, ns, handler) {};
JSJaCHttpBindingConnection.prototype.connect = function(cfg) {};
JSJaCHttpBindingConnection.prototype.disconnect = function() {};
JSJaCHttpBindingConnection.prototype.resume = function() {};
JSJaCHttpBindingConnection.prototype.send = function(p) {};
JSJaCHttpBindingConnection.prototype.sendIQ = function(p, handlers, context) {};
JSJaCHttpBindingConnection.prototype.suspend = function(p) {};

var JSJaCPacket = function() {};
JSJaCPacket.prototype.xml = function() {};
JSJaCPacket.prototype.getFromJID = function() {};
JSJaCPacket.prototype.getFrom = function() {};
JSJaCPacket.prototype.pType = function() {};
JSJaCPacket.prototype.getChild = function(tag, ns) {};
JSJaCPacket.prototype.getChildVal = function(tag, ns) {};

var JSJaCJID = function() {};
JSJaCJID.prototype.getBareJID = function() {};
JSJaCJID.prototype.getNode = function() {};
JSJaCJID.prototype.getDomain = function() {};
JSJaCJID.prototype.getResource = function() {};
JSJaCJID.prototype.removeResource = function() {};
JSJaCJID.prototype.setNode = function(str) {};
JSJaCJID.prototype.setDomain = function(str) {};
JSJaCJID.prototype.setResource = function(str) {};
JSJaCJID.prototype.toString = function() {};

var JSJaCPresence = function() {};
JSJaCPresence.prototype.setTo = function(str) {};
JSJaCPresence.prototype.setType = function(str) {};
JSJaCPresence.prototype.setShow = function(str) {};
JSJaCPresence.prototype.setStatus = function(str) {};
JSJaCPresence.prototype.buildNode = function(str, obj, val) {};
JSJaCPresence.prototype.appendNode = function(str, obj, val) {};
JSJaCPresence.prototype.getFrom = function() {};
JSJaCPresence.prototype.getFromJID = function() {};
JSJaCPresence.prototype.getType = function() {};
JSJaCPresence.prototype.getStatus = function() {};

var JSJaCMessage = function() {};
JSJaCMessage.prototype.setTo = function(str) {};
JSJaCMessage.prototype.setType = function(str) {};
JSJaCMessage.prototype.setSubject = function(str) {};
JSJaCMessage.prototype.setBody = function(str) {};
JSJaCMessage.prototype.buildNode = function(str, obj, val) {};
JSJaCMessage.prototype.appendNode = function(str, obj, val) {};
JSJaCMessage.prototype.getFromJID = function() {};
JSJaCMessage.prototype.getBody = function() {};
JSJaCMessage.prototype.getSubject = function() {};
JSJaCMessage.prototype.getType = function() {};
JSJaCMessage.prototype.getChatState = function() {};
JSJaCMessage.prototype.setChatState = function(state) {};

var JSJaCIQ = function() {};
JSJaCIQ.prototype.setType = function(str) {};
JSJaCIQ.prototype.setQuery = function(str) {};
JSJaCIQ.prototype.setIQ = function(to, type, id) {};
JSJaCIQ.prototype.buildNode = function(str, obj, val) {};
JSJaCIQ.prototype.appendNode = function(str, obj, val) {};

var gettext = function(msgid) {};
var ngettext = function(singular, plural, count) {};
var interpolate = function(msgid, obj, named) {};
