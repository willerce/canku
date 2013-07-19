var util = require('../libs/util.js');
var db = require('../global.js').database;
var dateformat = require('dateformat');
var _ = require('underscore');


// bind mongodb collection
db.bind('shop');
db.bind('food');
db.bind('order');


/**
 * get today order
 */
exports.getToday = function (cb) {
  var h = (new Date(util.getUTC8Time()).getHours());
  var start_t = '';
  var end_t = '';
  if (h < 15) {
    start_t = dateformat(new Date(), 'yyyy-mm-dd ') + "00:00:00";
    end_t = dateformat(new Date(), 'yyyy-mm-dd ') + "15:00:00";
  } else {
    start_t = dateformat(new Date(), 'yyyy-mm-dd ') + "15:00:00";
    end_t = dateformat(new Date(new Date().getTime() + 24 * 60 * 60 * 1000), 'yyyy-mm-dd ') + "00:00:00";
  }

  //根据时间范围进行查找
  db.order.find({time: {$gt: start_t, $lt: end_t}}).toArray(function (err, orders) {
    if (!err) {

      if (orders.length == 0) {
        cb("null");
        return;
      }

      //------------按店铺对订单进行分组
      var group = {};

      //统计
      var analyse = function (shop_id, order, i) {
        //将店铺加到数组中
        group[shop_id].orders.push(order);

        //比较运气值，找到比较差的那个
        if (order.luck <= group[shop_id].minLuck.luck) {
          if (!order.canceled || //如果订单没被取消
            orders.filter(function (o) {//或者[订单所有者[在今天有[没取消的订单]]]
              return o.user_name == order.user_name && !o.canceled
            }).length) {
            group[shop_id].minLuck = order;
          }
        }

        if (!order.canceled) {
          //累计这个店铺订单的总价
          group[shop_id].totalPrice += order.total;

          //统计各种美食数量
          for (var j in order.order) {
            //累计总数量
            group[shop_id].totalNum += parseInt(order.order[j].num);

            if (group[shop_id].analytics[order.order[j].id] == undefined) {
              group[shop_id].analytics[order.order[j].id] = {name: order.order[j].name, num: parseFloat(orders[i].order[j].num)};
            } else {
              group[shop_id].analytics[order.order[j].id].num = parseFloat(group[shop_id].analytics[order.order[j].id].num) + parseFloat(order.order[j].num);
            }
          }
        }

        i++;

        //如果已经循环完成，则渲染
        if (orders.length == i) {
          //数组化
          cb(null, {error: null, group: _.toArray(group)});
        } else {//否则继续进行循环
          forEach(i);
        }

      };

      // 进行递归循环检查 group 中是否已经存在该店铺，如果无，则向数据库查询后，创建一个 group 中的子项
      var forEach = function (i) {

        //店铺ID
        var shop_id = orders[i].shop_id;

        //订单
        var order = orders[i];

        //不存在这个店铺，需要先查找出店铺信息后再添加
        if (!group[shop_id]) {
          db.shop.findOne({'_id': db.ObjectID.createFromHexString(shop_id)}, function (err, shop) {
            group[shop_id] = {
              shop: shop,
              totalPrice: 0,
              totalNum: 0,
              minLuck: {luck: 100},
              analytics: {},
              orders: []
            };
            //统计金额，以及数量
            analyse(shop_id, order, i);
          });
        } else {
          //统计金额，以及数量
          analyse(shop_id, order, i);
        }
      }

      //开始执行
      forEach(0);

    } else {
      cb("error", null);
    }
  })
};