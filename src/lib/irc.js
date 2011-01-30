
var net = require('net');
var inspect = require('sys').inspect;
var nop = function () {};

var connect = exports.connect = function (config, callbacks) {

  var log_debug = function (message) {
    (callbacks.debug || nop)(message);
  };

  // 'reconnect()' is 'connect()' initially.
  (function reconnect () {
    var stream = net.createConnection(config.port, config.host);

    var capabilities = {
      end: function () {
        stream.end();
      }
    };
    stream.on('close', function (has_error) {
      (callbacks.end || nop)(has_error);
    });

    var ready_debit = 0;
    var ready = function () {
      if (--ready_debit === 0) {
        log_debug('ready, capabilities: ' + inspect(Object.keys(capabilities)));
        (callbacks.ready || nop)(capabilities);
      }
    };

    stream.on('connect', function () {
      send('NICK ' + config.nick);
      send('USER ' + config.nick + ' 0 * :' + config.name);
      send('JOIN ' + config.channel);
    });

    var send = capabilities.send = function (x) {
      stream.write(x + '\n');
    };

    if (!callbacks.PING) {
      callbacks.PING = function (msg) {
        send('PONG :' + msg.params[0]);
      };
    };

    // RFC 2812: 366 RPL_ENDOFNAMES
    ++ready_debit;
    callbacks['366'] = function (msg) {
      ready();
    };

    split(stream, '\n', function (line) {
      var msg = parse(line);
      if (msg) {
        (callbacks[msg.command] || callbacks.unhandled_command || nop)(msg);
        (callbacks.message || nop)(line);
      };
    });

    stream.on('error', function (err) {
      if (config.reconnect_timeout) {
        log_debug(err + '; retrying in ' + config.reconnect_timeout + 'ms');
        // TODO only retry on ETIMEDOUT?
        // TODO do we have to clean up something here?
        setTimeout(reconnect, config.reconnect_timeout);
      }
      (callbacks.error || nop)(err);

      if (!config.reconnect_timeout || !callbacks.error) {
        // No one cares about us?  Well, node will...
        throw new Error(err.message);
      }
    });
  })();
};

var split = require('./stream').split;
var parse_privmsg = require('./irc/privmsg').parse_privmsg;

var parsers = {
  PRIVMSG: parse_privmsg
};

var parse = exports.parse = function (string) {
  var re = /^(?::(\S+)\s+)?(\S+)((?:\s+[^\s:]+)*(?:\s+:.*)?)/;
  var xs = re.exec(string);
  if (xs) {
    var prefix = xs[1],
        command = xs[2],
        params = xs[3];
    var y = {};
    if (prefix) {
      y.prefix = prefix;
      var yre = /^([^!]+)(?:[!]((?:[^@]+)?[@](?:.+)))?/;
      var yxs = yre.exec(y.prefix);
      if (yxs) {
        y.prefix = {};
        if (yxs[1]) y.prefix.name = yxs[1];
        if (yxs[2]) y.prefix.user = yxs[2];
      };
    };
    if (command) y.command = command;
    if (params) {
      var lhs = params.split(':')[0].trim(/\s+/);
      var rhs = params.split(':').slice(1).join(':');
      lhs = lhs ? lhs.split(/\s+/) : [];

      y.params = lhs.concat(rhs);
    };
  };

  if (command && parsers[command]) {
    var parser = parsers[command];
    y = parser(y);
  };

  return y;
};
