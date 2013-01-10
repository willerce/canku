/**
 * User: willerce
 * Date: 11/14/12
 * Time: 1:24 PM
 */

var db = require("../global").database;

db.bind("order");


// url: /pay
exports.index = function (req, res, next) {

  //获取订单号
  var order_id = req.query["order_id"];

  //获取订单信息、
  db.order.findOne({_id:db.ObjectID.createFromHexString(order_id)}, function (err, result) {
    if (!err) {
      res.render('pay/index');
    } else {
      next();
    }
  });

};

exports.today_order = function (req, res, next) {

  //用户信息
  var user_id = req.session.user._id;
  var user_name = req.session.user.name;

  //设置时间范围
  var today_0 = dateformat(new Date(), 'yyyy-mm-dd ') + "00:00:00";
  var today_24 = dateformat(new Date(new Date().getTime() + 24 * 60 * 60 * 1000), 'yyyy-mm-dd ') + "00:00:00";

  //查询用户的今日订单
  db.order.find({time:{$gt:today_0, $lt:today_24}, user_id:user_id}).toArray(function (err, orders) {
    if (!err) {
      //查询到用户今日订单了
      if (orders.length > 0) {
        res.send(orders);
      }
    } else {
      res.send({"err":"application error"});
    }
  });
};