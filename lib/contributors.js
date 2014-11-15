
/**
 * Module dependencies.
 */

var _             = require('lodash')
  , util          = require('util')
  , EventEmitter  = require('events').EventEmitter
  , request       = require('urllib').request

var authors = require('./git').authors

/**
 * Constructor
 */

function Contributors(path, fn) {
  if (!(this instanceof Contributors)) {
    return new Contributors().fetch(path, fn)
  }

  EventEmitter.call(this)
}

util.inherits(Contributors, EventEmitter)
module.exports = Contributors

/**
 * Get emails from git log
 * @param {String} path
 * @param {Function} fn
 * @return {Contributors}
 * @api public
 */

Contributors.prototype.getEmails = function(path, fn) {
  fn = fn || function() {}

  authors(path, function(err, list) {
    if (err) return fn(err)

    // TODO: 'name' will be used in next release
    list = _.pluck(list, 'email')

    // filter output. email is the unique key.
    list = _.uniq(list)

    return fn(null, list)
  })

  return this
}

/**
 * Get user profile via GitHub API
 * @param {String} email
 * @param {Function} fn
 * @return {Contributors}
 * @api public
 */

Contributors.prototype.getProfile = function(email, fn) {
  fn = fn || function() {}

  var url = 'https://api.github.com/legacy/user/email/' + encodeURIComponent(email)
  var userAgent = 'node-contributors/' + require('../package.json').version
  var args = {
    dataType: 'json',
    headers: { 'user-agent': userAgent },
    timeout: 15000, // network too bad in China
    gzip: true
  }
  request(url, args, function(err, data, res) {
    if (err) return fn(err)

    if (!data.user) {
      var e = errorException(data.message, 'APIError')
      e.result = data
      e.status = res.statusCode
      return fn(e)
    }

    return fn(null, data.user)
  })

  return this
}

/**
 * Fetching contributors
 * @param {String} path
 * @param {Function} fn
 * @return {Contributors}
 * @api public
 */

Contributors.prototype.fetch = function(path, fn) {
  fn = fn || function() {}
  var self = this

  self.getEmails(path, function(err, list) {
    if (err) {
      self.emit('error', err)
      return fn(err)
    }

    var count = list.length
      , result = []

    self.emit('fetching', count)

    ;(function recurse(i) {
      if (i >= count) {
        var json = {
            generatedAt: Number(new Date())
          , contributors: result
        }
        self.emit('done', json)
        return fn(null, json)
      }

      self.getProfile(list[i], function(err, user) {
        if (err) {
          if (err.code && 'APIError' == err.code && 404 == err.status) {
            // ignore commiters not in github
            self.emit('fetched')
            recurse(++i)
          } else {
            self.emit('error', err)
            return fn(err)
          }
        } else {
          self.emit('fetched')
          result.push(user)
          recurse(++i)
        }
      })
    })(0)
  })

  return self
}

function errorException(message, code) {
  var e = new Error(message)
  if (code) e.name = e.code = e.errno = code
  return e
}
