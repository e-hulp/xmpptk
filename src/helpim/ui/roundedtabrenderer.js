/**
 * @fileoverview Rounded corner tab renderer for {@link goog.ui.Tab}s.
 *
 */

goog.provide('helpim.ui.RoundedTabRenderer');

goog.require('goog.ui.RoundedTabRenderer');

/**
 * Rounded corner tab renderer for {@link goog.ui.Tab}s enhanced with
 * close buttons.
 * @constructor
 * @extends {goog.ui.RoundedTabRenderer} 
 */
helpim.ui.RoundedTabRenderer = function() {
    goog.ui.RoundedTabRenderer.call(this);
};
goog.inherits(helpim.ui.RoundedTabRenderer, goog.ui.RoundedTabRenderer);
goog.addSingletonGetter(helpim.ui.RoundedTabRenderer);

helpim.ui.RoundedTabRenderer.prototype._logger = goog.debug.Logger.getLogger('helpim.ui.RoundedTabRenderer');

/**
 * Creates a table row implementing the tab caption.
 * @inheritDoc
 */
helpim.ui.RoundedTabRenderer.prototype.createCaption = function(dom, caption) {
    var baseClass = this.getStructuralCssClass();
    this.closeButton_ = dom.createDom(
        'div',
        {'title':gettext('clickt to close'),
         'className': goog.getCssName(baseClass, 'closeTab')}
    );
    goog.events.listen(
        this.closeButton_,
        'click',
        function(e) {
            this._logger.info("close button clicked");
            if (goog.isFunction(this.closeButtonClickedHandler_)) {
                this.closeButtonClickedHandler_();
            }
        },
        false,
        this
    );
    return dom.createDom('tr', null,
                         dom.createDom('td', {'noWrap': true}, 
                                       this.closeButton_,
                                       dom.createDom('div', goog.getCssName(baseClass, 'caption'),
                                                     caption)));
};

helpim.ui.RoundedTabRenderer.prototype.setCloseButtonClickedHandler_ = function(handler, ctxt) {
    this.closeButtonClickedHandler_ = goog.bind(handler, ctxt);
};