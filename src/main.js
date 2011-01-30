var config = require('./lib/config').readFileSync(process.argv[2]);
var connect = require('genericore').connect;
var irc_connect = require('./lib/irc').connect;

// TODO log to 'log'-exchange
var log = function (message) {
  console.log('ircspy: ' + message);
};

config.amqp.output = config.ircspy.output;

var amqp, irc;
connect(config.amqp, {
  debug: function (x) {
    log('AMQP: [31;1m' + x + '[m');
  },
  ready: function (capabilities) {
    amqp = capabilities;
    irc_connect({
      host: config.ircspy.server,
      port: config.ircspy.port,
      nick: config.ircspy.nick,
      name: config.ircspy.name,
      channel: config.ircspy.channel
    }, {
      ready: function (capabilities) {
        irc = capabilities;
      },
      debug: function (x) {
        log('IRC: [1;34m' + x + '[m');
      },
      PRIVMSG: function (privmsg) {
        if (privmsg.text === '!die') {
          irc.end();
          return;
        };
        privmsg.server = config.ircspy.server
        privmsg.port = config.ircspy.port
        amqp.publish(JSON.stringify({
          type: 'irc',
          subtype: 0,
          data: privmsg
        }));
      }
    });
  }
});
