var JSJaC = function() {};
JSJaC.bind = function(fun, obj) {};

var JSJaCHttpBindingConnection = function() {};
JSJaCHttpBindingConnection.prototype.registerHandler = function(event, handler) {};
JSJaCHttpBindingConnection.prototype.registerIQSet = function(child, ns, handler) {};
JSJaCHttpBindingConnection.prototype.connect = function(cfg) {};
JSJaCHttpBindingConnection.prototype.disconnect = function() {};
JSJaCHttpBindingConnection.prototype.resume = function() {};
JSJaCHttpBindingConnection.prototype.send = function(p) {};
JSJaCHttpBindingConnection.prototype.suspend = function(p) {};

var JSJaCPresence = function() {};
JSJaCPresence.prototype.setTo = function(str) {};
JSJaCPresence.prototype.setType = function(str) {};
JSJaCPresence.prototype.setShow = function(str) {};
JSJaCPresence.prototype.setStatus = function(str) {};
JSJaCPresence.prototype.buildNode = function(str, obj, val) {};
JSJaCPresence.prototype.appendNode = function(str, obj, val) {};

var JSJaCMessage = function() {};
JSJaCMessage.prototype.setTo = function(str) {};
JSJaCMessage.prototype.setType = function(str) {};
JSJaCMessage.prototype.setBody = function(str) {};
JSJaCMessage.prototype.buildNode = function(str, obj, val) {};
JSJaCMessage.prototype.appendNode = function(str, obj, val) {};

var JSJaCIQ = function() {};
JSJaCIQ.prototype.setType = function(str) {};
JSJaCIQ.prototype.setQuery = function(str) {};
JSJaCIQ.prototype.buildNode = function(str, obj, val) {};
JSJaCIQ.prototype.appendNode = function(str, obj, val) {};
