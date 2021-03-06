'use strict'

/*
 * adonis-vow
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const path = require('path')
const globby = require('globby')
const debug = require('debug')('adonis:vow:cli')

/**
 * The Cli class is used to load the test files
 * to be executed when running tests. It allows
 * user to specific different test directories
 * for unit and functional tests and even
 * ignore few files.
 *
 * @class Cli
 * @static
 */
class Cli {
  constructor (Env, Helpers) {
    this.projectRoot = Helpers.appRoot()
    this._unitTests = Env.get('UNIT_TESTS', 'test/unit/*.spec.js')
    this._functionalTests = Env.get('FUNCTIONAL_TESTS', 'test/functional/*.spec.js')
    this._ignoreTests = Env.get('IGNORE_TESTS', [])
    this._filterCallback = null
  }

  /**
   * Returns a glob pattern to be used for loading
   * the test files.
   *
   * @method _getGlob
   *
   * @param  {Array} includes
   * @param  {Array}  excludes
   *
   * @return {Array}
   *
   * @private
   */
  _getGlob (includes, excludes = []) {
    const absIncludes = includes.map((glob) => path.join(this.projectRoot, glob))
    const absExcludes = excludes.map((glob) => `!${path.join(this.projectRoot, glob)}`)
    return absIncludes.concat(absExcludes)
  }

  /**
   * Define a glob pattern to be used for loading
   * unit tests
   *
   * @method unit
   *
   * @param  {String} glob
   *
   * @chainable
   */
  unit (glob) {
    debug('setting unit tests glob as %s', glob)
    this._unitTests = glob
    return this
  }

  /**
   * Define a glob to be used for loading functional
   * tests
   *
   * @method al
   *
   * @param  {String} glob
   *
   * @chainable
   */
  functional (glob) {
    debug('setting functional tests glob as %s', glob)
    this._functionalTests = glob
    return this
  }

  /**
   * Define a custom filter callback to be used for
   * filtering the test files
   *
   * @method filter
   *
   * @param  {String|Function|Array} patternOrCallback
   *
   * @chainable
   */
  filter (patternOrCallback) {
    if (typeof (patternOrCallback) === 'function') {
      this._filterCallback = patternOrCallback
    } else if (typeof (patternOrCallback) === 'string' || patternOrCallback instanceof Array === true) {
      this._ignoreTests = patternOrCallback
    } else {
      throw new Error('cli.filter accepts an array/string of globs or a callback function')
    }
    return this
  }

  /**
   * Returns an array of test files with their absolute
   * path. These files should be loaded directly and
   * then tests can be executed
   *
   * @method getTestFiles
   *
   * @return {Array}
   */
  async getTestFiles () {
    const includes = [this._unitTests, this._functionalTests].filter((test) => !!test)
    const excludes = typeof (this._ignoreTests) === 'string' ? [this._ignoreTests] : this._ignoreTests

    const files = await globby(this._getGlob(includes, excludes), {
      realpath: true
    })

    /**
     * If there is no filter callback, all files are returned
     * Otherwise user is given a chance to filter test files.
     */
    if (typeof (this._filterCallback) !== 'function') {
      return files
    }

    const testFiles = files.filter(this._filterCallback)
    debug('test files %j', testFiles)
    return testFiles
  }
}

module.exports = Cli
