goog.provide('xmpptk.ui.Emoticons');

goog.require('goog.object');

xmpptk.ui.Emoticons = {
};

xmpptk.ui.Emoticons.path = "images/emoticons/";

xmpptk.ui.Emoticons.init = function(base_url) {

  if (typeof base_url != 'undefined') {
    xmpptk.ui.Emoticons.path = base_url + xmpptk.ui.Emoticons.path;
  }

  goog.object.forEach(
    xmpptk.ui.Emoticons,
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
      icon.src = xmpptk.ui.Emoticons.path + val;

      xmpptk.ui.Emoticons[key] = {regexp: eval("/\(\\s\|\^\)"+key_q+"\(\\s|\$\)/g"), icon: icon};
    }
  );
};
