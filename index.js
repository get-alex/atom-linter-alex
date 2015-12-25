/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module atom:linter:alex
 * @fileoverview Linter.
 */

/* global atom */

'use strict';

/*
 * Dependencies (alex is lazy-loaded later).
 */

var deps = require('atom-package-deps');
var minimatch = require('minimatch');
var alex;

/*
 * Constants.
 */

var config = atom.config;

/**
 * Activate.
 */
function activate() {
    deps.install('linter-alex');
}

/**
 * Atom meets alex to catch insensitive, inconsiderate
 * writing.
 *
 * @return {LinterConfiguration}
 */
function linter() {
    var CODE_EXPRESSION = /`([^`]+)`/g;

    /**
     * Transform a (stringified) vfile range to a linter
     * nested-tuple.
     *
     * @param {Object} location - Positional information.
     * @return {Array.<Array.<number>>} - Linter range.
     */
    function toRange(location) {
        return [[
            Number(location.start.line) - 1,
            Number(location.start.column) - 1
        ], [
            Number(location.end.line) - 1,
            Number(location.end.column) - 1
        ]];
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
          'html': toHTML(message.reason),
          'filePath': this.getPath(),
          'range': toRange(message.location)
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
        var settings = config.get('linter-alex');

        if (minimatch(editor.getPath(), settings.ignoreFiles)) {
            return [];
        }

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

    return {
        'grammarScopes': config.get('linter-alex').grammars,
        'name': 'alex',
        'scope': 'file',
        'lintOnFly': true,
        'lint': onchange
    }
}

/*
 * Expose.
 */

module.exports = {
    'config': {
        'ignoreFiles': {
            'description': 'Disable files matching (minimatch) glob',
            'type': 'string',
            'default': ''
        },
        'grammars': {
            'description': 'List of scopes for languages which will be ' +
                'checked. Note: setting new sources overwrites the ' +
                'defaults.',
            'type': 'array',
            'default': [
                'source.asciidoc',
                'source.gfm',
                'source.pfm',
                'text.git-commit',
                'text.plain',
                'text.plain.null-grammar'
            ]
        }
    },
    'provideLinter': linter,
    'activate': activate
}
