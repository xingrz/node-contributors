
/**
 * Module dependencies.
 */

var _             = require('lodash')
  , util          = require('util')
  , EventEmitter  = require('events').EventEmitter
  , request       = require('urllib').request
  , async         = require('async')

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
 * Get git log
 * @param {String} path
 * @param {Function} fn
 * @return {Contributors}
 * @api public
 */

Contributors.prototype.getLog = function(path, fn) {
  fn = fn || function() {}

  authors(path, function(err, list) {
    if (err) {
      return fn(err)
    } else {
      return fn(null, _.uniq(list, 'email'))
    }
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

  self.getLog(path, function(err, list) {
    if (err) {
      self.emit('error', err)
      return fn(err)
    }

    var count = list.length
      , result = []

    self.emit('fetching', count)

    async.mapSeries(list, function(item, next) {
      self.getProfile(item.email, function(err, user) {
        if (err) {
          if (err.code && 'APIError' == err.code && 404 == err.status) {
            self.emit('fetched')
            return next(null, item)
          } else {
            return next(err)
          }
        } else {
          self.emit('fetched')
          item.name = user.name
          item.web = 'https://github.com/' + user.login
          return next(null, item)
        }
      })
    }, function(err, list) {
      if (err) {
        self.emit('error', err)
        return fn(err)
      } else {
        var result = {
          generatedAt: Number(new Date())
        , contributors: list
        }
        self.emit('done', result)
        return fn(null, result)
      }
    })
  })

  return self
}

function errorException(message, code) {
  var e = new Error(message)
  if (code) e.name = e.code = e.errno = code
  return e
}
