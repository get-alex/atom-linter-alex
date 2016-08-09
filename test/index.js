/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @fileoverview Test suite for `linter-alex`.
 */

'use strict';

/* global atom */

/* Dependencies. */
var path = require('path');
var test = require('tape');
var lint = require('..');

/* Methods. */
var join = path.join;

test('unified-engine-atom', function (t) {
  t.plan(2);

  atom.workspace.destroyActivePaneItem();

  Promise.resolve()
    .then(function () {
      return atom.packages.activatePackage(
        join(__dirname, '..')
      );
    })
    .then(function () {
      return atom.packages.activatePackage('language-gfm');
    })
    .then(function () {
      return atom.workspace.open(
        join(path.resolve(__dirname, '..'), 'readme.md')
      );
    })
    .then(function (editor) {
      return lint.provideLinter().lint(editor);
    })
    .then(function (messages) {
      t.equal(messages.length, 0, 'should start out without messages');
    })
    .then(function () {
      return atom.workspace.open(
        join(__dirname, 'invalid.md')
      );
    })
    .then(function (editor) {
      return lint.provideLinter().lint(editor);
    })
    .then(function (messages) {
      t.deepEqual(
        messages.map(flatten),
        [
          '<code>boogeyman</code> may be insensitive, use ' +
          '<code>boogey</code> instead',
          '<code>master</code> / <code>slaves</code> may be ' +
          'insensitive, use <code>primary</code> / <code>replica' +
          '</code> instead',
          '<code>he</code> may be insensitive, use <code>they</code>, ' +
          '<code>it</code> instead',
          '<code>cripple</code> may be insensitive, use <code>person ' +
          'with a limp</code> instead',
          'Be careful with <code>butt</code>, it’s profane in some ' +
          'cases'
        ],
        'should emit messages'
      );
    });
});

function flatten(message) {
  return message.html;
}
