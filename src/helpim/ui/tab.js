goog.provide('helpim.ui.Tab');

goog.require('goog.ui.Tab');

/**
 * @constructor
 * @extends {goog.ui.Tab}
 * @inheritDoc
 */
helpim.ui.Tab = function(content, opt_renderer, opt_domHelper) {
    goog.ui.Tab.call(this, content, opt_renderer, opt_domHelper);

    // ???
//    this.setSupportedState(goog.ui.Component.State.CLOSE, true);
    opt_renderer.setCloseButtonClickedHandler_(goog.bind(this.handleClose_, this));
};
goog.inherits(helpim.ui.Tab, goog.ui.Tab);

helpim.ui.Tab.prototype._logger = goog.debug.Logger.getLogger('helpim.ui.Tab');

helpim.ui.Tab.prototype.setOnCloseHandler = function(handler, ctxt) {
    this.onCloseHandler_ = goog.bind(handler, ctxt);
};

helpim.ui.Tab.prototype.handleClose_ = function() {
    this._logger.info("closing tab");
    if (goog.isFunction(this.onCloseHandler_)) {
        this.onCloseHandler_();
    }
};

