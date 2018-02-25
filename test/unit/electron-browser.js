'use strict'

const test = require('tape')
const ElectronBrowser = require('../../lib/electron-browser')
const abstractSuite = require('./abstract-browser')

abstractSuite('ElectronBrowser', ElectronBrowser)

test('ElectronBrowser toString', function (t) {
  const browser = new ElectronBrowser()

  t.is(browser.toString(), '<electron>')
  t.end()
})
