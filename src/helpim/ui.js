goog.provide('helpim.ui');

/**
 * returns static path of given file.
 * @param {string} filename the relative path and filename of the file to get static url for.
 */
helpim.ui.getStatic = function(filename) {
	return xmpptk.Config['static_url']+filename;
};

helpim.ui.NICK_COLORS_CSSCLASSPREFIX = 'nickColor';
helpim.ui.NICK_COLORS_LENGTH = 12;

/**
 * calculates a color used for given nick
 */
helpim.ui.getNickColor = function(nick) {
    alert("getNickColor");
    return helpim.ui.NICK_COLORS_CSSCLASSPREFIX + 
        goog.array.reduce(nick.split(""), function(acc, c) { return acc + c.charCodeAt(); }, 0) % (helpim.ui.NICK_COLORS_LENGTH-1);
}

/**
 * creates a readable string out of an error object
 * @param {{code: string, type: string, condition: string}} error the actual errror object
 * @return {string}
 */
helpim.ui.errorToString = function(error) {
    return 'Code: ' + error.code + ' - Type: ' + error.type + ' - Condition: ' + error.condition;
};