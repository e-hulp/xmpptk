goog.provide('xmpptk.Model');

goog.require('xmpptk.Subject');
goog.require('goog.object');
goog.require('goog.array');

/**
 * @constructor
 * @extends {xmpptk.Subject}
 */
xmpptk.Model = function() {
    xmpptk.Subject.call(this);
    /** @private */
    this._propertyHandlers = {};
};
goog.inherits(xmpptk.Model, xmpptk.Subject);

/**
 * Attach a handler to a property.
 * @param {string} property the property to attach to
 * @param {function(object, string)} handler the handler to be called when property is being updated
 * @param {?object} context context to bind handler to (the this reference within the handler)
 */
xmpptk.Model.prototype.attachPropertyhandler = function(property, handler, context) {
    if (!this._propertyHandlers[property]) {
        this._propertyHandlers[property] = [];
    }
    if (context) {
        handler = goog.bind(handler, context);
    }
    this._propertyHandlers[property].push(handler);
};

/**
 * retrieve the value of a property
 * @param {string} prop the property to retrieve the value for
 * @return {object} whatever has been assigned to the property
 */
xmpptk.Model.prototype.get = function(prop) {
    if (typeof prop == 'undefined') {
        // return object with all of our properties
        var obj = {};

        for (var i in this) {
            if (this.hasOwnProperty(i)) { // it's a member property
                if (i.indexOf('_') !== 0) { // no hidden props
                    obj[i] = this[i];
                }
            }
        }
        return obj;
    }
    // return named property
    if (typeof this[prop] != 'undefined') {
        return this[prop];
    }
    throw "property not found: "+prop;
};

/**
 * Updates the value of a property
 * @param {string} prop the property to be updated
 * @param {object} value the value to assign to the property
 * @param {?boolean} skip_notify whether to not notify observers about this update
 */
xmpptk.Model.prototype.set = function(prop, value, skip_notify) {
    if (!prop) {
        // I don't see a reason how prop could be null here but
        // somehow in MSIE it turns out to be so in some cases. At
        // least this makes fckwing MSIE work so don't get crazy and
        // just forget about it!
        return;
    }

    if (typeof value == 'undefined') {
        // fill in whole object
        goog.object.forEach(
            prop,
            function(val, key) {
                this.set(key, val, true);
            },
            this
        );
    } else if (prop.indexOf('_') != 0) { // skip hidden props
        this[prop] = value;
    }

    if (!skip_notify) {
        // notify observers registered by observer pattern
        this.notify(prop);
        // notify propertyhandlers
        if (goog.isArray(this._propertyHandlers[prop])) {
            goog.array.forEach(
                this._propertyHandlers[prop],
                goog.bind(function(handler) {
                    handler(this.get(prop), prop);
                }, this)
            );
        }
    }

    return this;
};