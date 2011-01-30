
exports.parse_privmsg = function (msg) {
  try {
    var privmsg = {};
    if (msg.prefix) privmsg.prefix = msg.prefix;
    if (msg.command) privmsg.command = msg.command;
    if (msg.params) {
      privmsg.msgtargets = msg.params[0].split(',');
      privmsg.text = msg.params[1];
    };
    return privmsg;
  } catch (err) {
    log('parse_privmsg: ' + err);
  }
};

