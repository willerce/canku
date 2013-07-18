/**
 * 管理中心
 * User: willerce
 * Date: 9/17/12
 * Time: 7:40 PM
 */

var fs = require('fs');
var path = require('path');
var db = require('../global').database;
var util = require('../libs/util');
var dateformat = require('dateformat');

db.bind('shop');
db.bind('food');
db.bind('user');
db.bind('balance_logs');

exports.index = function (req, res) {
  res.render('admin/index', {title: "后台管理"});
};


exports.shop_index = function (req, res) {
  db.shop.find({}).toArray(function (err, result) {
    if (!err) {
      res.render('admin/shop/index', {title: "店铺列表", shops: result});
    } else {
      res.render('admin/shop/index', {itle: "店铺列表", shops: []});
    }
  });
};

exports.shop_add = function (req, res) {
  if (req.method == "GET") {
    res.render('admin/shop/add', {title: "添加店铺"});
  }
  else if (req.method == "POST") {
    var name = req.body.name;
    var address = req.body.address;
    var tel = req.body.tel;

    var shop = {
      'name': name,
      'address': address,
      'tel': tel,
      'categories': req.body.categories,
      'css': req.body.css,
    };

    db.shop.insert(shop, function (err, result) {
      if (!err) {
        res.redirect('/admin/shop');
      }
    });
  }
};

exports.shop_edit = function (req, res) {
  if (req.method == "GET") {
    db.shop.findOne({"_id": db.ObjectID.createFromHexString(req.params.id)}, function (err, shop) {
      res.render('admin/shop/edit', {title: "店铺编辑", "shop": shop});
    });
  } else if (req.method == "POST") {
    var shop = {
      'name': req.body.name,
      'address': req.body.address,
      'tel': req.body.tel,
      'categories': req.body.categories,
      'css': req.body.css,
    };

    db.shop.update({"_id": db.ObjectID.createFromHexString(req.body.id)}, {'$set': shop}, function (err) {
      if (err) {
        console.log("err");
        res.redirect('/admin/shop?msg=error&action=edit');
      } else {
        res.redirect('/admin/shop?msg=success&action=edit');
      }
    })
  }
};

exports.food_add = function (req, res) {
  if (req.method == 'GET') {
    db.shop.findOne({'_id': db.ObjectID.createFromHexString(req.query['shop_id'])}, function (err, shop) {
      if (!err) {
        //获取食品
        db.food.find({'shop_id': req.query['shop_id']}).sort({category: 1}).toArray(function (err, foods) {
          if (!err) {
            console.log(util.get_week);
            res.render('admin/food/add', {title: "添加美食", 'shop': shop, 'foods': foods, week: util.get_week});
          } else {
            console.log('获取店铺出错了，ID是：' + req.params.id);
            next();
          }
        });
      } else {
        console.log('获取店铺出错了，ID是：' + req.params.id);
      }
    });
  } else if (req.method == 'POST') {
    var shop_id = req.body.id;
    var name = req.body.name;
    var price = req.body.price;
    var week = req.body.week;
    var category = req.body.categories;

    var food = {
      'name': name,
      'price': price,
      'shop_id': shop_id,
      'week': week,
      'category': category
    };

    db.food.insert(food, function (err, result) {
      if (!err) {
        console.log(result);
        res.redirect('/admin/food/add?shop_id=' + shop_id);
      }
    });
  }
}

exports.food_edit = function (req, res) {
  if (req.method == "GET") {
    db.food.findOne({"_id": db.ObjectID.createFromHexString(req.params.id)}, function (err, food) {
      console.log(food);
      db.shop.findOne({'_id': db.ObjectID.createFromHexString(food.shop_id)}, function (err, shop) {
        res.render('admin/food/edit', {title: "编辑美食", "food": food, "shop": shop});

      });
    });
  } else {
    db.food.findOne({"_id": db.ObjectID.createFromHexString(req.params.id)}, function (err, food) {
      food.name = req.body.name;
      food.price = req.body.price;
      food.week = req.body.week;
      food.category = req.body.categories;
      delete food._id;
      db.food.update({"_id": db.ObjectID.createFromHexString(req.params.id)}, {'$set': food}, function (err) {
        if (err) {
          console.log("err");
          res.redirect('/admin/food/edit/' + req.params.id + '?msg=error&action=edit');
        } else {
          res.redirect('/admin/food/edit/' + req.params.id + '?msg=success&action=edit');
        }
      });
    });
  }
};

exports.user_index = function (req, res) {
  if (req.session.user) {
    //这里如果用户有超级管理权限则能看到用户列表，否则为空白
    if (req.session.user.isAdmin) {
      var isAdmin = req.session.user.isAdmin;
      db.user.find().sort({reg_time: -1}).toArray(function (err, users) {
        return res.render('admin/user/index', { title: '用户管理', isAdmin: isAdmin, users: users})
      });
    } else {
      return res.render('admin/user/index', { title: '用户管理', isAdmin: isAdmin});
    }
  } else {
    return res.redirect(config.login_path);
  }
};

exports.user_delete = function (req, res) {
  var id = req.params.id;
  db.user.remove({"_id": db.ObjectID.createFromHexString(req.params.id)}, function (err, result) {
    if (!err) {
      return res.send(200);
    }
  });
};

exports.user_orders = function (req, res) {
  var id = req.params.id;
  //获取当前用户的ID{user_id:req.session.user._id}
  db.order.find({user_id: id}).sort({time: -1}).toArray(function (err, result) {
    if (!err) {
      res.render('admin/user/orders', {title: "用户订单", orders: result});
    }
    ;
  });
};

exports.user_add_balance = function (req, res) {

  if (req.method === "GET") {
    var user_id = req.query['user_id'];
    var result = req.query['result'];
    db.user.findOne({"_id": db.ObjectID.createFromHexString(user_id)}, function (err, user) {
      res.render('admin/user/add_balance', {title: "冲值", user: user, result: result});
    });

  } else if (req.method === "POST") {

    if (!req.session.user.isAdmin) {
      return
    }

    var user_id = req.body.user_id;
    var amount = req.body.amount;

    db.user.findOne({"_id": db.ObjectID.createFromHexString(user_id)}, function (err, user) {

      var balance_log = {
        created: util.getUTC8Time("YYYY-MM-DD HH:mm:ss"),
        user_id: user_id,
        type: 'recharge',//充值
        amount: parseFloat(amount).toFixed(2),
        balance: (parseFloat(user.balance || 0) + parseFloat(amount)).toFixed(2),
        describe: req.session.user.name + "为你充值" + amount + "元人民币"
      };

      db.balance_logs.insert(balance_log, function (err, result) {
        if (!err) {
          //修改用户余额

          user.balance = balance_log.balance;
          delete user._id;
          db.user.update({"_id": db.ObjectID.createFromHexString(user_id)}, {'$set': user}, function (err, user) {
            if (!err) {
              res.redirect('admin/user/add_balance?result=success&user_id=' + user_id);
            } else {
              next();
            }
          });
        }
      })

    });
  }

};

exports.balance = function (req, res) {
  db.user.findOne({'_id': db.ObjectID.createFromHexString(req.query['user_id'])}, function (err, user) {
    if (!err) {
      db.balance_logs.find({user_id: req.query['user_id']}).sort({created: -1}).toArray(function (err, balances) {
        res.render("admin/user/balance", {title: "用户记录", user: user, balances: balances});
      });
    }
  });
};

exports.user_isAdmin = function (req, res) {
  var id = req.params.id;
  db.user.findOne({"_id": db.ObjectID.createFromHexString(id)}, function (err, user) {
    if (user.isAdmin) {
      user.isAdmin = false;
    } else {
      user.isAdmin = true;
    }
    delete user._id;
    db.user.update({"_id": db.ObjectID.createFromHexString(id)}, {'$set': user}, function (err, result) {
      if (!err) {
        console.log(user);
        return res.send(user.isAdmin);
      }
    });
  });
}

exports.user_operateShop = function (req, res) {
  var id = req.params.id;
  db.user.findOne({"_id": db.ObjectID.createFromHexString(id) }, function (err, user) {
    if (user.canOperateShop) {
      user.canOperateShop = false;
    } else {
      user.canOperateShop = true;
    }
    delete user._id;
    db.user.update({"_id": db.ObjectID.createFromHexString(id)}, {'$set': user}, function (err, result) {
      if (!err) {
        return res.send(user.canOperateShop);
      }
    });
  });
}

exports.food_delete = function (req, res) {
  var id = req.params.id;
  db.food.remove({"_id": db.ObjectID.createFromHexString(id)}, function (err, result) {
    if (!err) {
      res.send(200);
    }
  });
};


exports.shop_delete = function (req, res) {
  var id = req.params.id;
  db.shop.remove({"_id": db.ObjectID.createFromHexString(id)}, function (err, result) {
    if (!err) {
      db.food.remove({"shop_id": id}, function (err) {
        if (!err) {
          res.send(200);
        }
      })
    }
  });
}
