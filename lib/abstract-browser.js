'use strict'

const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits

function AbstractBrowser () {
  if (!(this instanceof AbstractBrowser)) {
    return new AbstractBrowser()
  }

  EventEmitter.call(this)
  this.resetStats()
}

inherits(AbstractBrowser, EventEmitter)

module.exports = AbstractBrowser

AbstractBrowser.prototype.resetStats = function () {
  this.stats = {
    passed: 0,
    failed: 0
  }
}
