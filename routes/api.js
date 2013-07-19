var service = require('../libs/service');

exports.today = function (req, res, next) {
  service.getToday(function (err, result) {
    if (err) {
      res.send({ error: null});
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.write(JSON.stringify(result));
      res.end();
    }
  })
};