'use strict';

/* eslint-env node, browser */
/* global atom */

var CompositeDisposable = require('atom').CompositeDisposable;

exports.activate = activate;
exports.deactivate = deactivate;
exports.provideLinter = provideLinter;

/* Internal variables. */
var load = loadOnce;
var minimatch;
var engine;
var unified;
var markdown;
var english;
var control;
var remark2retext;
var equality;
var profanities;
var idleCallbacks = [];
var subscriptions = new CompositeDisposable();
var config = {};

function lint(editor) {
  load();

  if (minimatch(editor.getPath(), config.ignoreFiles)) {
    return [];
  }

  return engine({
    processor: unified,
    detectIgnore: config.detectIgnore,
    detectConfig: config.detectConfig,
    rcName: '.alexrc',
    packageField: 'alex',
    ignoreName: '.alexignore',
    defaultConfig: transform(),
    configTransform: transform
  })(editor);
}

function provideLinter() {
  return {
    grammarScopes: config.scopes,
    name: 'alex',
    scope: 'file',
    lintsOnChange: true,
    lint: lint
  };
}

function activate() {
  var schema = require('./package').configSchema;
  var id = window.requestIdleCallback(install);
  idleCallbacks.push(id);

  Object.keys(schema).forEach(function (key) {
    subscriptions.add(atom.config.observe('linter-alex.' + key, setter));

    function setter(value) {
      config[key] = value;
    }
  });

  function install() {
    idleCallbacks.splice(idleCallbacks.indexOf(id), 1);

    /* Install package dependencies */
    if (!atom.inSpecMode()) {
      require('atom-package-deps').install('linter-alex');
    }

    /* Load required modules. */
    load();
  }
}

function deactivate() {
  idleCallbacks.forEach(removeIdleCallback);
  idleCallbacks = [];

  subscriptions.dispose();

  function removeIdleCallback(id) {
    window.cancelIdleCallback(id);
  }
}

function loadOnce() {
  engine = require('unified-engine-atom');
  unified = require('unified');
  english = require('retext-english');
  markdown = require('remark-parse');
  remark2retext = require('remark-retext');
  control = require('remark-message-control');
  equality = require('retext-equality');
  profanities = require('retext-profanities');
  minimatch = require('minimatch');

  load = noop;
}

function noop() {}

function transform(options) {
  var settings = options || {};

  return {
    plugins: [
      markdown,
      [
        remark2retext,
        unified()
          .use(english)
          .use(profanities)
          .use(equality, {noBinary: settings.noBinary})
      ],
      [filter, {allow: settings.allow}],
      severity
    ]
  };
}

function filter(options) {
  return control({
    name: 'alex',
    disable: options.allow,
    source: ['retext-equality', 'retext-profanities']
  });
}

function severity() {
  var map = {
    0: null,
    1: false,
    2: true,
    undefined: false
  };

  return transformer;

  function transformer(tree, file) {
    file.messages.forEach(transform);
  }

  function transform(message) {
    message.fatal = map[message.profanitySeverity];
  }
}
