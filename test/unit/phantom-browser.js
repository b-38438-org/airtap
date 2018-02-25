'use strict'

const test = require('tape')
const PhantomBrowser = require('../../lib/phantom-browser')
const abstractSuite = require('./abstract-browser')

abstractSuite('PhantomBrowser', PhantomBrowser)

test('PhantomBrowser toString', function (t) {
  const browser = new PhantomBrowser()

  t.is(browser.toString(), '<phantom>')
  t.end()
})
