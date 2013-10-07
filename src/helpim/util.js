goog.provide('helpim.Util');
goog.provide('helpim.Util.iosTabAlert');

helpim.Util.iosTabAlert.Init = function() {
       /* IOS halts execution when a new browser tab is opened.
          That behaviour kills the XMPP session. We can't prevent
          this on IOS, so we warn the users when a new tab is
          openend. */
       if (navigator.platform === 'iPad' || navigator.platform === 'iPhone' || navigator.platform === 'iPod'){
           console.log('IOS detected, setting tabalart');
           /* Only register events on IOS devices. IOS 6.x and
              IOS 7.0 handle opening a new tab differently so we
              register two events and warn on the one that is
              fired first. */
           helpim.Util.iosTabAlert.Given = false;
           if(typeof document.addEventListener == 'function') {
               document.addEventListener("visibilitychange", helpim.Util.iosTabAlert.VisibilityChange);
           };
           window.onpagehide = helpim.Util.iosTabAlert.Warn;
       };
   };

helpim.Util.iosTabAlert.VisibilityChange = function() {
       // only fire warning if the document became hidden
       if (document.hidden) {
           helpim.Util.iosTabAlert.Warn();
       };
   };

helpim.Util.iosTabAlert.Warn = function() {
      // Warn, but only once
      if (!helpim.Util.iosTabAlert.Given) {
          alert(gettext('Warning: this action will disconnect your chat conversation.'));
          helpim.Util.iosTabAlert.Given = true;
      };
   };

goog.exportSymbol("helpim.Util.iosTabAlert.Init", helpim.Util.iosTabAlert.Init)
goog.exportSymbol("helpim.Util.iosTabAlert.VisibilityChange", helpim.Util.iosTabAlert.VisibilityChange)
goog.exportSymbol("helpim.Util.iosTabAlert.Warn", helpim.Util.iosTabAlert.Warn)
