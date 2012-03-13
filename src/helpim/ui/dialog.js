goog.provide('helpim.ui.Dialog');

goog.require('goog.ui.Dialog');

/**
 * @inheritDoc
 * @constructor
 * @extends {goog.ui.Dialog}
 * Just like goog.ui.Dialog but accecpts multiple classnames for
 * opt_class separated by blanks. The first one is being passed as
 * argument to the goog.ui.Dialog constructor.
 */
helpim.ui.Dialog = function(opt_class, opt_useIframeMask, opt_domHelper) {
    opt_class = opt_class || "modal-dialog";
    opt_class = opt_class.split(" ");
    // fucking IE needs a second argument to splice - see also
    // http://www.coshima.com/2011/02/02/array-splice-in-internet-explorer/
    this._classes = opt_class.splice(1, opt_class.length-1);
    this._logger.info(this._classes);

    goog.ui.Dialog.call(this, opt_class, opt_useIframeMask, opt_domHelper);
};
goog.inherits(helpim.ui.Dialog, goog.ui.Dialog);

helpim.ui.Dialog.prototype._logger = goog.debug.Logger.getLogger('helpim.ui.Dialog');

/** @inheritDoc */
helpim.ui.Dialog.prototype.createDom = function() {
    goog.base(this, 'createDom');
    goog.dom.classes.add(this.getElement(), this._classes);
};