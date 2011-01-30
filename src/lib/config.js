
var sys = require('sys');
var log = function (x) {
  sys.puts('config: ' + x);
};
var fs = require('fs');

exports.readFileSync = function (filename) {
  log(filename);
  var config = JSON.parse(fs.readFileSync(filename));
  log(sys.inspect(config));
  return config;
};

