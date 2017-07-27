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

test('linter-alex', function (t) {
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
          'Don’t use `slaves`, it’s profane (retext-profanities:slaves)',
          '`boogeyman` may be insensitive, use `boogey` instead (retext-equality:boogeyman-boogeywoman)',
          '`master` / `slaves` may be insensitive, use `primary` / `replica` instead (retext-equality:master-slave)',
          '`cripple` may be insensitive, use `person with a limp` instead (retext-equality:cripple)',
          '`he` may be insensitive, use `they`, `it` instead (retext-equality:he-she)'
        ],
        'should emit messages'
      );
    });
});

function flatten(message) {
  return message.excerpt;
}
