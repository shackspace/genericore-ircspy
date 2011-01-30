
// Split stream
var split = function (stream, boundary, callback) {
  var last;
  stream.on('data', function (data) {
    var chunks = String(data).split(boundary);

    // Combine last chunk into current batch.
    if (typeof last !== 'undefined') {
      chunks[0] = last + chunks[0];
    };

    // Remove the last chunk that could be incomplete.
    last = chunks.pop();

    // chunk batch
    chunks.forEach(callback);
  });
  stream.on('end', function () {
    // Replay the very last chunk, if any.
    if (typeof last !== 'undefined') {
      callback(last);
    };
  });
};

exports.split = split;
