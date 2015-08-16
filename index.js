/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module atom:linter:alex
 * @fileoverview Linter.
 */

'use strict';

/*
 * Dependencies (lazy-loaded later).
 */

var alex;

/**
 * Atom meets alex to catch insensitive, inconsiderate
 * writing.
 *
 * @return {LinterConfiguration}
 */
function linter() {
    var RANGE_EXPRESSION = /(\d+):(\d+)(?:-(\d+):(\d+))?/;
    var CODE_EXPRESSION = /`([^`]+)`/g;

    /**
     * Transform a (stringified) mdast range to a linter
     * nested-tuple.
     *
     * @param {string} range - Stringified range.
     * @return {Array.<Array.<number>>} - Linter range.
     */
    function getRange(range) {
        var match = range.match(RANGE_EXPRESSION);
        var result = [[], []];

        result[0][0] = Number(match[1]) - 1;
        result[0][1] = Number(match[2]) - 1;
        result[1][0] = Number(match[3]) - 1;
        result[1][1] = Number(match[4]) - 1;

        return result;
    }

    /**
     * Transform a reason for warning from alex into
     * pretty HTML.
     *
     * @param {string} reason - Messsage in plain-text.
     * @return {string} - Messsage in HTML.
     */
    function toHTML(reason) {
        return reason.replace(CODE_EXPRESSION, '<code>$1</code>');
    }

    /**
     * Transform VFile messages
     * nested-tuple.
     *
     * @see https://github.com/wooorm/vfile#vfilemessage
     *
     * @param {VFileMessage} message - Virtual file error.
     * @return {Object} - Linter error.
     */
    function transform(message) {
        return {
          'type': 'Error',
          'text': message.reason,
          'html': toHTML(message.reason),
          'filePath': this.getPath(),
          'range': getRange(message.name)
      };
    }

    /**
     * Handle on-the-fly or on-save (depending on the
     * global atom-linter settings) events. Yeah!
     *
     * Loads `alex` on first invocation.
     *
     * @see https://github.com/atom-community/linter/wiki/Linter-API#messages
     *
     * @param {AtomTextEditor} editor - Access to editor.
     * @return {Promise.<Message, Error>} - Promise
     *  resolved with a list of linter-errors or an error.
     */
    function onchange(editor) {
        return new Promise(function (resolve, reject) {
            var messages;

            if (!alex) {
                alex = require('alex');
            }

            try {
                messages = alex(editor.getText()).messages;
            } catch (e) {
                reject(e);
                return;
            }

            resolve((messages || []).map(transform, editor));
        });
    }

    // He is such a douche So is she..

    return {
        'grammarScopes': [
            'source.gfm',
            'source.pfm',
            'text.git-commit',
            'text.plain',
            'text.plain.null-grammar'
        ],
        'scope': 'file',
        'lintOnFly': true,
        'lint': onchange
    }
}

/*
 * Expose.
 */

module.exports = {
    'config': {},
    'provideLinter': linter
}
