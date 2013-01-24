/*
 * GET home page.
 */

var db = require('../global.js').database;
var util = require('../libs/util.js');
var dateformat = require('dateformat');

// mongoskin databse bind
db.bind('shop');
db.bind('food');
db.bind('order');

// GET URL /today
exports.today = function (req, res, next) {

  var h = (new Date(util.getUTC8Time()).getHours());
  var start_t = '';
  var end_t = '';
  if(h<15){
    start_t = dateformat(new Date(), 'yyyy-mm-dd ') + "00:00:00";
    end_t = dateformat(new Date(), 'yyyy-mm-dd ') + "15:00:00";
  }else{
    start_t = dateformat(new Date(), 'yyyy-mm-dd ') + "15:00:00";
    end_t = dateformat(new Date(new Date().getTime() + 24 * 60 * 60 * 1000), 'yyyy-mm-dd ') + "00:00:00";
  }

  //设置时间范围
  db.order.find({time:{$gt:start_t, $lt:end_t}}).toArray(function (err, orders) {
    if (!err) {

      if (orders.length == 0) {
        res.render('today', { error:'null'});
        return;
      }

      //------------对 orders 进行分组
      var group = {};

      var analytics = function (shop_id, order, i, callback) {
        //将店铺加到数组中
        group[shop_id].orders.push(order);

        //累计这个店铺订单的总价
        group[shop_id].totalPrice += order.total;

        //比较运气值，找到比较差的那个
        if (order.luck <= group[shop_id].minLuck.luck) {
          group[shop_id].minLuck = order;
        }


        //统计各种美食数量
        for (var j in order.order) {
          //累计总数量
          group[shop_id].totalNum += parseInt(order.order[j].num);

          if (group[shop_id].analytics[order.order[j].id] == undefined) {
            group[shop_id].analytics[order.order[j].id] = {name:order.order[j].name, num:parseFloat(orders[i].order[j].num)};
          } else {
            group[shop_id].analytics[order.order[j].id].num = parseFloat(group[shop_id].analytics[order.order[j].id].num) + parseFloat(order.order[j].num);
          }
        }
        i++;

        //如果已经循环完成，则渲染
        if (orders.length == i)
          res.render('today', { group:group, error:null, time : "h:" + h + ", start_t" + start_t + ", end_t" + end_t });
        else//否则继续进行循环
          forEach(i);
      }

      //主要进行循环检查 group 中是否已经存在该店铺，如果无，则向数据库查询后，创建一个 group 中的子项
      var forEach = function (i) {

        //店铺ID
        var shop_id = orders[i].shop_id;

        //订单
        var order = orders[i];

        //不存在这个店铺
        if (!group[shop_id]) {
          db.shop.findOne({'_id':db.ObjectID.createFromHexString(shop_id)}, function (err, shop) {
            group[shop_id] = {
              shop:shop,
              totalPrice:0,
              totalNum:0,
              minLuck:{luck:100},
              analytics:{},
              orders:[]
            };
            //统计金额，以及数量
            analytics(shop_id, order, i);
          });
        } else {
          //统计金额，以及数量
          analytics(shop_id, order, i);
        }
      }

      //开始执行
      forEach(0);

    } else {
      res.render('today', { eror:'error' });
    }
  })
};

// GET URL /shop
exports.index = function (req, res, next) {
  db.shop.find().toArray(function (err, shops) {
    if (!err) {
      res.render('index', {'shops':shops})
    } else {
      next();
    }
  });
};

// GET URL: /shop/_id    [5057458f9fc93f6001000001]
exports.shop = function (req, res, next) {
  db.shop.findOne({'_id':db.ObjectID.createFromHexString(req.params.id)}, function (err, shop) {
    if (!err) {
      //获取今天的星期
      var week = util.getUTC8Day().toString();
      db.food.find({'shop_id':req.params.id, week:{$in:['-1', week]}}).sort({category:1}).toArray(function (err, foods) {
        if (!err) {

          //进行分组处理
          var group = [];
          for (var i = 0; i < foods.length; i++) {
            var category = foods[i].category;//分类
            if (category) {
              var index = category.split('#');
              if (!group[index[0]]) {
                //不存在这个分类，需要创建这个数组
                group[index[0]] = {'name':index[1], 'foods':[]}
              }

              //向该分类推入这个商品
              group[index[0]].foods.push(foods[i]);

            } else {
              console.log(foods.name + "没有无法确定分类");
            }
          }
          //页面渲染
          res.render('shop', {'shop':shop, 'group':group});
        } else {
          console.log('获取店铺出错了，ID是：' + req.params.id + ":error" + err);
          next();
        }
      });
    } else {
      console.log('获取店铺出错了，ID是：' + req.params.id);
      next();
    }
  });
};

// POST URL: /submit_order
exports.submit_order = function (req, res) {

  //计算运气
  var luck = Math.floor(Math.random() * 100);

  //获取订单
  var order_list = JSON.parse(req.body.list);
  var shop_id = req.body.shop_id;
  var shop_name = req.body.shop_name;

  var total = 0.0;
  for (var i in order_list) {
    total = total + ( parseFloat(order_list[i].price) * parseInt(order_list[i].num));
  }

  //插入订单
  db.order.insert({shop_id:shop_id, shop_name:shop_name, user_id:req.session.user._id, user_name:req.session.user.name, time:util.getUTC8Time("YYYY-MM-DD HH:mm:ss"), total:total, order:order_list, luck:luck}, function (err, result) {
    if (!err) {
      console.log(result);
      res.send('{"result":"success","luck":"' + luck + '"}');
    } else {
      console.log(err);
      res.send('{"result":"error"}');
    }
  })
};

exports.get_shop = function (req, res) {
  var _id = req.query["id"];
  db.shop.findOne({'_id':db.ObjectID.createFromHexString(_id)}, function (err, result) {
    if (!err) {
      res.send(JSON.stringify(result));
    }
  });
}

// URL: /404
exports.pageNotFound = function (req, res) {
  console.log('404 handler..');
  res.render('404', {status:404, title:'页面不存在'});
};
