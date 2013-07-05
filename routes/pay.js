/**
 * User: willerce
 * Date: 11/14/12
 * Time: 1:24 PM
 */

var db = require("../global").database;
var util = require('../libs/util')

db.bind("order");


// url: /pay
exports.item = function (req, res, next) {

  //获取订单号
  var order_id = req.query["order_id"];

  //获取订单信息、x
  db.order.findOne({_id: db.ObjectID.createFromHexString(order_id)}, function (err, order) {
    if (!err) {

      db.user.findOne({'name': req.session.user.name}, function (err, user) {
        if (!err) {
          res.render('pay/item', {order: order, user: user});
        }
      });

    } else {
      next();
    }
  });

};

exports.submit_pay = function (req, res) {
  if (req.method == "GET") {
    var result = req.query['result'];
    db.user.findOne({"_id": db.ObjectID.createFromHexString(req.session.user._id.toString())}, function (err, user) {
      res.render('pay/submit_pay', {user: user, result: result});
    });
  } else if (req.method == "POST") {
    var order_id = req.body.order_id;

    //查询订单
    db.order.findOne({_id: db.ObjectID.createFromHexString(order_id)}, function (err, order) {
      if (!err) {

        //如果该订单已经支付，返回今日订单界面
        if (order.payStatus === "paid") {
          res.redirect('/today');
          return;
        }

        //---------开始进行付款流程------------------
        db.user.findOne({"_id": db.ObjectID.createFromHexString(req.session.user._id)}, function (err, user) {
          //添加余额变动记录
          var balance_log = {
            created: util.getUTC8Time("YYYY-MM-DD HH:mm:ss"),
            user_id: user._id.toString(),
            type: 'pay',//充值
            amount: parseFloat(0 - order.total).toFixed(2),
            balance: (parseFloat(user.balance || 0) + parseFloat(0 - order.total)).toFixed(2),
            describe: "支付了 <a target=\"_blank\" href=\"/shop/" + order.shop_id + "\">" + order.shop_name + "</a> 的订单"
          };

          db.balance_logs.insert(balance_log, function (err, result) {
            if (!err) {
              //修改用户帐户余额
              db.user.update({"_id": user._id}, {'$set': {"balance": balance_log.balance}}, function (err) {
                if (!err) {
                  //修改订单支付状态
                  db.order.update({"_id": order._id}, {'$set': {"payStatus": "paid"}}, function (err) {
                    if (!err) {
                      res.redirect('/pay/submit_pay?result=success');
                    } else {
                      next();
                    }
                  });
                } else {
                  next();
                }
              });
            }
          })
        });
      } else {
        res.send({"err": "application error"});
      }
    });
  }
}

exports.today_order = function (req, res, next) {

  //用户信息
  var user_id = req.session.user._id;
  var user_name = req.session.user.name;

  //设置时间范围
  var today_0 = dateformat(new Date(), 'yyyy-mm-dd ') + "00:00:00";
  var today_24 = dateformat(new Date(new Date().getTime() + 24 * 60 * 60 * 1000), 'yyyy-mm-dd ') + "00:00:00";

  //查询用户的今日订单
  db.order.find({time: {$gt: today_0, $lt: today_24}, user_id: user_id}).toArray(function (err, orders) {
    if (!err) {
      //查询到用户今日订单了
      if (orders.length > 0) {
        res.send(orders);
      }
    } else {
      res.send({"err": "application error"});
    }
  });
};