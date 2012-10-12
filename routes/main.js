/*
 * GET home page.
 */

var db = require('../global.js').database;
var util = require('../libs/util.js');
var dateformat = require('dateformat');

db.bind('shop');
db.bind('food');
db.bind('order');
db.bind('caller');

// URL /
exports.today = function(req, res, next){
  db.order.find({time:{$gt:dateformat(new Date(), 'yyyy-mm-dd ')+"00:00:00",$lt:dateformat(new Date(new Date().getTime() + 24 * 60 * 60 * 1000), 'yyyy-mm-dd ')+"00:00:00"}}).toArray(function(err, orders){
    if(!err){
      var total = 0.0;
      var num = 0;
      var dian = [];
      var minLuck = {
        luck : 100,
      };
      for(var i in orders){
        total += orders[i].total;

        //统计各种美食数量
        for(var j in orders[i].order){

          //找出运气最差的
          if(orders[i].luck<minLuck.luck){
            minLuck = orders[i];
          }

          num += parseInt(orders[i].order[j].num);
          if(dian[orders[i].order[j].id]==undefined){
            dian[orders[i].order[j].id] = {name:orders[i].order[j].name, num : parseFloat(orders[i].order[j].num)};
          }else{
            dian[orders[i].order[j].id].num = parseFloat(dian[orders[i].order[j].id].num)+parseFloat(orders[i].order[j].num);
          }
        }
      }
      res.render('today', { orders : orders , total: total, num : num, dian : dian, minLuck : minLuck});
    }else{
      res.render('today', { eror: 'error' });
    }
  });
};

// URL /shop
exports.index = function(req, res, next){
  //获取今天的星期

  db.shop.find().toArray(function(err, shops){
    if(!err){
      res.render('index', {'shops':shops})
    }else{
      next();
    }
  });
};

// URL: /shop/_id    [5057458f9fc93f6001000001]
exports.shop_item = function(req, res, next){
  db.shop.findOne({'_id' : db.ObjectID.createFromHexString(req.params.id)}, function(err, shop){
    if(!err){
      //获取食品
      var week = (new Date()).getDay().toString();
      db.food.find({'shop_id':req.params.id,week:{$in:['0',week]}}).toArray(function(err, foods){
        if(!err){
          res.render('shop_item', {'shop':shop, 'foods': foods});
        }else{
          console.log('获取店铺出错了，ID是：'+req.params.id +":error"+err);
          next();
        }
      });
    }else{
      console.log('获取店铺出错了，ID是：'+req.params.id);
      next();
    }
  });
};

//提交订单
// POST URL: /submit_order
exports.submit_order = function(req, res) {

  //计算运气
  var luck = Math.floor(Math.random() * 100);

  //获取订单
  var order_list = JSON.parse(req.body.list);
  var shop_id = req.body.shop_id;
  var shop_name = req.body.shop_name;

  var total = 0.0;
  for(var i in order_list){
    total = total + ( parseFloat(order_list[i].price) * parseInt(order_list[i].num));
  }

  //插入订单
  db.order.insert({shop_id: shop_id, shop_name: shop_name, user_id:req.session.user._id, user_name: req.session.user.name, time : dateformat(new Date(), 'yyyy-mm-dd hh:MM:ss'), total : total,  order: order_list, luck : luck}, function(err, result){
    if(!err){
      console.log(result);
      res.send('{"result":"success","luck":"'+luck+'"}');
    }else{
      console.log(err);
      res.send('{"result":"error"}');
    }
  })
}

// URL /order
exports.order = function(req, res){
  //获取当前用户的ID{user_id:req.session.user._id}
  db.order.find({user_id:req.session.user._id.toString()}).sort({time: -1}).toArray(function(err, result){
    if(!err){
      res.render('order', {orders: result});
    };
  });
}

exports.submit_caller = function(req, res){

  var name = req.body.name;
  var user_id = req.session.user._id.toString();
  var user_name = req.session.user.name.toString();
  var date = dateformat(new Date(), 'yyyymmdd');

  db.caller.find({date:{$lte:dateformat(new Date(), 'yyyymmdd')}}).sort({date: -1}).toArray(function(err, result){
    if(!err){
      if( (result.length>0 && result[0].name === user_name) || (result.length == 0 && user_name === 'admin')){
        if(result[0].date==dateformat(new Date(), 'yyyymmdd')){
          res.send('{"result":"ed", "name":"'+result[0].do_user_name+'"}');
        }else{
          db.caller.insert({do_user_id : user_id, do_user_name: user_name, name: name,  date: date },function(err, result){
            if(!err){
              res.send('{"result":"success"}');
            }else{
              res.send('{"result":"error"}');
            }
          });
        }
      }else{
        res.send('{"result":"not-u"}');
      }
    }else{
      res.send('{"result":"not-u"}');
    }
  })
}