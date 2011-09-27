goog.provide('helpim.ui');

/**
 * returns static path of given file.
 * @param {string} filename the relative path and filename of the file to get static url for.
 */
helpim.ui.getStatic = function(filename) {
	return xmpptk.Config['static_url']+filename;
};