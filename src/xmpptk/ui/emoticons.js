goog.provide('xmpptk.ui.emoticons');

goog.require('goog.object');
goog.require('goog.string');

/** @typedef {{icon:object, regexp:object}} */
xmpptk.ui.emoticons.Replacement;

/** @type {object.<xmpptk.ui.emoticons.Replacement>} */
xmpptk.ui.emoticons.replacements = {
    ':-)': 'smile.gif',
    ':)': 'smile.gif',
    '(:': 'smile.gif',
    '=)': 'smile.gif',
    ':]': 'smile.gif',
    ':>': 'smile.gif'

};

xmpptk.ui.emoticons.path = "images/emoticons/";

xmpptk.ui.emoticons.init = function(base_url) {

  if (base_url) {
      if (!goog.string.endsWith(base_url, '/')) {
          base_url += '/';
      }
      xmpptk.ui.emoticons.path = base_url + xmpptk.ui.emoticons.path;
  }

  goog.object.forEach(
      xmpptk.ui.emoticons.replacements,
      function(val, key) {
          
          var key_q = key.replace(/\\/g, '\\\\');
          key_q = key_q.replace(/\)/g, '\\)');
          key_q = key_q.replace(/\(/g, '\\(');
          key_q = key_q.replace(/\[/g, '\\[');
          key_q = key_q.replace(/\]/g, '\\]');
          key_q = key_q.replace(/\}/g, '\\}');
          key_q = key_q.replace(/\{/g, '\\{');
          key_q = key_q.replace(/\//g, '\\/');
          key_q = key_q.replace(/\|/g, '\\|');
          key_q = key_q.replace(/\*/g, '\\*');
          key_q = key_q.replace(/\+/g, '\\+');
          
          var icon = new Image();
          icon.src = xmpptk.ui.emoticons.path + val;
          
          xmpptk.ui.emoticons.replacements[key] = {
              regexp: eval("/\(\\s\|\^\)"+key_q+"\(\\s|\$\)/g"), 
              icon: icon
          };
      }
  );
};
