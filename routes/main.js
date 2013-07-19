/*
 * GET home page.
 */

var fs = require('fs');
var path = require('path');
var db = require('../global.js').database;
var util = require('../libs/util.js');
var dateformat = require('dateformat');
var service = require('../libs/service');
var config = require('../global').config;

// mongoskin databse bind
db.bind('shop');
db.bind('food');
db.bind('order');
db.bind('user');
db.bind('balance_logs');

// GET URL /today
exports.today = function (req, res, next) {
  service.getToday(function (err, result) {
    if (err) {
      res.render('today', { error: 'null'});
    } else {
      res.render('today', result);
    }
  })
};

// GET URL /shop
exports.index = function (req, res, next) {
  db.shop.find().toArray(function (err, shops) {
    if (!err) {
      res.render('index', {'shops': shops})
    } else {
      next();
    }
  });
};

// GET URL: /shop/_id    [5057458f9fc93f6001000001]
exports.shop = function (req, res, next) {
  db.shop.findOne({'_id': db.ObjectID.createFromHexString(req.params.id)}, function (err, shop) {
    if (!err) {
      //获取今天的星期
      var week = util.getUTC8Day().toString();
      db.food.find({'shop_id': req.params.id, week: {$in: ['-1', week]}}).sort({category: 1}).toArray(function (err, foods) {
        if (!err) {

          //进行分组处理
          var group = [];
          for (var i = 0; i < foods.length; i++) {
            var category = foods[i].category;//分类
            if (category) {
              var index = category.split('#');
              if (!group[index[0]]) {
                //不存在这个分类，需要创建这个数组
                group[index[0]] = {'name': index[1], 'foods': []}
              }

              //向该分类推入这个商品
              group[index[0]].foods.push(foods[i]);

            } else {
              console.log(foods.name + "没有无法确定分类");
            }
          }
          //检查有没有图片菜单
          (function (cb) {
            if (shop.picmenu) {
              shop.picmenu = "data:image/jpeg;base64," + shop.picmenu.buffer.toString('base64');
              cb();
            } else {
              path.exists(path.join(__dirname, '..', 'public', 'picmenu' + req.params.id + '.jpg'), function (exists) {
                shop.picmenu = exists ? '/picmenu' + req.params.id + '.jpg' : '';
                //页面渲染
                cb();
              });
            }
          })(function (err) {
            res.render('shop', {'shop': shop, 'group': group});
          });
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
  db.order.insert({
    shop_id: shop_id,
    shop_name: shop_name,
    user_id: req.session.user._id,
    user_name: req.session.user.name,
    time: util.getUTC8Time("YYYY-MM-DD HH:mm:ss"),
    total: total,
    order: order_list,
    luck: luck,
    canceled: false,
    payStatus: 'deafult'
  }, function (err, result) {
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
  db.shop.findOne({'_id': db.ObjectID.createFromHexString(_id)}, function (err, result) {
    if (!err) {
      res.send(JSON.stringify(result));
    }
  });
}


// url: /pay
exports.pay_item = function (req, res, next) {

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
        db.user.findOne({"name": req.session.user.name}, function (err, user) {
          if (!err) {

            //添加余额变动记录
            var balance_log = {
              created: util.getUTC8Time("YYYY-MM-DD HH:mm:ss"),
              user_id: user._id.toString(),
              type: 'pay',//充值
              amount: parseFloat(0 - order.total).toFixed(2),
              balance: (parseFloat(user.balance || 0) + parseFloat(0 - order.total)).toFixed(2),
              describe: "支付了 <a href=\"/shop/" + order.shop_id + "\">" + order.shop_name + "</a> 的订单 › <a href=\"/user/order#order-" + order._id + "\">查看订单详情</a>"
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
          }
        });
      } else {
        res.send({"err": "application error"});
      }
    });
  }
}

exports.login = function (req, res) {
  if (req.method == "GET") {
    //只要访问了登录页，就清除cookie
    res.clearCookie(config.auth_cookie_name, {
      path: '/'
    });
    switch (req.query['tip']) {
      case 'error':
        var tip = "帐号或密码错误，请重试";
        break;
      default :
        var tip = null;
        break;
    }
    res.render('user/login', {tip: tip});
  } else if (req.method == "POST") {

    var reMail = /^(?:[a-zA-Z0-9]+[_\-\+\.]?)*[a-zA-Z0-9]+@(?:([a-zA-Z0-9]+[_\-]?)*[a-zA-Z0-9]+\.)+([a-zA-Z]{2,})+$/;
    var account = req.body.account;
    var password = util.md5(req.body.password);

    var query = null;

    if (reMail.test(account)) {
      //使用邮箱登录
      query = {'email': account.toLowerCase(), 'password': password}
    } else {
      //使用名号登录
      query = {'name': account, 'password': password}
    }

    // 向数据库查询用户
    db.user.findOne(query, function (err, user) {
      if (!err) {
        if (user != null) {
          util.gen_session(user.name, user.password, res);
          res.redirect('/');
        } else {
          res.redirect('/user/login?tip=error')
        }
      } else {
        res.redirect('/user/login?tip=error')
      }
    })
  }
};

exports.register = function (req, res) {
  if (req.method == "GET") {
    switch (req.query['tip']) {
      case 'notemtpy':
        var tip = "不填写完整的孩子是坏孩子";
        break;
      case 'exists_name':
        var tip = "该名号已经被使用了";
        break;
      case 'exists_email':
        var tip = "该邮箱地址已经被使用了";
        break;
      case 'failure':
        var tip = "注册失败，请重试";
        break
      default :
        var tip = null;
        break;
    }
    res.render('user/register', {tip: tip});
  } else if (req.method == "POST") {

    //获取用户的输入
    var name = req.body.name;
    var email = req.body.email.toLowerCase();
    var password = req.body.password;
    //验证用户空输入
    if (name == "" || password == "") {
      res.redirect('/user/register?tip=notemtpy');
      return;
    }

    //该邮箱是否已经被使用
    db.user.findOne({email: email}, function (err, name_result) {
      if (name_result == null) {//用户名未被使用
        //该用户名是否已经被使用
        db.user.findOne({name: name}, function (err, email_result) {

          if (email_result == null) {//邮箱未被使用

            /******************************
             * 可以注册了
             ******************************/

              // 密码进行MD5
            password = util.md5(password);
            var reg_time = util.getUTC8Time("YYYY-MM-DD HH:mm:ss");

            // 向数据库保存用户的数据，并进行 session 保存      /*添加管理权限字段 isAdmin canOperateShop*/
            db.user.insert({
              'name': name,
              'email': email,
              'reg_time': reg_time,
              'password': password,
              'isAdmin': email == config.admin_user_email,
              'canOperateShop': false
            }, function (err, user) {
              if (!err && user && user.length > 0) {
                if (user.length > 0) {
                  util.gen_session(user[0].name, user[0].password, res);
                  req.session.user = user[0];
                  res.redirect('/?tip=welcome');
                } else {
                  res.redirect('/user/register?tip=failure')
                }
              } else {
                res.redirect('/user/register?tip=failure')
              }
            });

          } else {//名号已经被使用

            res.redirect('/user/register?tip=exists_name')
          }
        });

      } else {//邮箱已经被使用
        res.redirect('/user/register?tip=exists_email')
      }
    });
  }
};

exports.auth = function (req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    var cookie = req.cookies[config.auth_cookie_name];
    if (!cookie) {
      return res.redirect(config.login_path);
    }

    var auth_token = util.decrypt(cookie, config.session_secret);
    var auth = auth_token.split('\t');
    var user_name = auth[0];

    db.user.findOne({'name': user_name}, function (err, user) {
      if (!err && user) {
        if (user.email == config.admin_user_email)
          user.isAdmin = true
        req.session.user = user;
        return next();
      }
      else {
        return res.redirect(config.login_path);
      }
    });
  }
};

exports.auth_admin = function (req, res, next) {
  if (req.session.user) {
    //如果用户有管理店铺的权限或者用户时超级管理员或者为配置中的用户  才可以进入管理后台
    if (req.session.user.canOperateShop || req.session.user.isAdmin || req.session.user.email == config.admin_user_email) {
      next();
    } else {
      return res.render('note', {title: '权限不够'});
    }

  } else {
    var cookie = req.cookies[config.auth_cookie_name];
    if (!cookie) {
      return res.redirect(config.login_path);
    }

    var auth_token = util.decrypt(cookie, config.session_secret);
    var auth = auth_token.split('\t');
    var user_name = auth[0];
    db.user.findOne({'name': user_name}, function (err, user) {
      if (!err && user) {
        if (user.email == config.admin_user_email)
          user.isAdmin = true
        req.session.user = user;

        //如果用户有管理店铺的权限或者用户是超级管理员或者为配置中的用户  才可以进入管理后台
        if (user.canOperateShop || user.isAdmin || req.session.user.email == config.admin_user_email) {
          return next()
        } else {
          return res.render('note', {title: '权限不够'})
        }
      }
      else {
        return res.redirect(config.login_path);
      }
    });
  }
}

//验证用户是否是超级管理员，只有超级管理员才有删除用户，改变用户权限的权限
exports.auth_super_admin = function (req, res, next) {
  if (req.session.user) {
    if (req.session.user.isAdmin || req.session.user.email == config.admin_user_email) {
      next();
    } else {
      return res.render('note', {title: '权限不够'});
    }
  }
}

exports.logout = function (req, res) {
  req.session.destroy();
  res.clearCookie(config.auth_cookie_name, {
    path: '/'
  });
  res.redirect('/user/login');
}

// URL /user/order
exports.user_order = function (req, res) {
  //获取当前用户的ID{user_id:req.session.user._id}
  db.order.find({user_id: req.session.user._id.toString()}).sort({time: -1}).toArray(function (err, result) {
    if (!err) {
      res.render('user/order', {orders: result});
    }
    ;
  });
};

// URL /user/account
exports.user_account = function (req, res) {

  if (req.method == "GET") {
    switch (req.query['tip']) {
      case 'empty':
        var tip = "请填写完整后再提交";
        break;
      case 'error':
        var tip = "更新错误，请重试";
        break;
      case 'old_pwd_error':
        var tip = "旧密码错误，请重试";
        break;
      case 'ok':
        var tip = "更新成功";
        break
      case 'name_exist':
        var tip = "名号已经被使用，请更换后再提交修改。";
        break;
      case 'email_exist':
        var tip = "邮箱已经被使用，请更换后再提交修改。";
        break;
      default :
        var tip = null;
        break;
    }
    db.user.findOne({'name': req.session.user.name}, function (err, result) {
      if (!err) {
        result.email = result.email || "";
        res.render('user/account', {user: result, tip: tip});
      }
    });
  } else {
    if (req.method == "POST") {

      //修改帐号
      db.user.findOne({'name': req.session.user.name}, function (err, result) {
        if (!err) {

          /* ------------ 非空验证 ----------*/
          var pwd = req.body.pwd;
          var new_pwd = req.body.new_pwd;
          var name = req.body.name;
          var email = req.body.email;
          if (name == "" || email == "" || (new_pwd != "" && pwd == "")) {
            res.redirect('/user/account?tip=empty');
            return;
          }

          result.email = email;
          result.name = name;

          //如果旧密码不为空，说明需要修改密码
          if (pwd != "") {
            //旧密码MD5
            var pwd = util.md5(req.body.pwd);
            if (result.password == pwd) {//旧密码填写正确
              result.password = util.md5(new_pwd);
            } else {
              res.redirect('/user/account?tip=old_pwd_error')
              return;
            }
          }

          //验证用户名是否已经存在
          db.user.findOne({'name': result.name}, function (err, user_name_exist) {
            if (!err) {
              //名号未被使用
              if (( user_name_exist != null && user_name_exist._id.id == result._id.id) || user_name_exist == null) {
                //验证邮箱是否已经被使用
                db.user.findOne({'email': result.email}, function (err, user_email_exist) {
                  if (!err) {
                    //邮箱未被使用
                    if (( user_email_exist != null && user_email_exist._id.id == result._id.id) || user_email_exist == null) {
                      var _id = result._id;
                      delete result._id;

                      db.user.update({"_id": _id}, {'$set': result}, function (err) {
                        if (err) {
                          res.redirect('/user/account?tip=error');
                        } else {
                          result._id = _id;
                          req.session.user = result;
                          util.gen_session(result.name, result.password, res);
                          res.redirect('/user/account?tip=ok');
                        }
                      });
                    } else {
                      res.redirect('/user/account?tip=email_exist')
                    }
                  } else {
                    res.redirect('/user/account?tip=error')
                  }
                });
              } else {
                res.redirect('/user/account?tip=name_exist')
              }
            } else {
              res.redirect('/user/account?tip=error')
            }
          });
        }
      });
    }
  }
};

// URL /user/balance
exports.user_balance = function (req, res) {

  db.user.findOne({'name': req.session.user.name}, function (err, user) {
    if (!err) {
      db.balance_logs.find({user_id: req.session.user._id.toString()}).sort({created: -1}).toArray(function (err, balances) {
        res.render("user/balance", {user: user, balances: balances});
      });
    }
  });

};

exports.user_forgetPassword = function (req, res) {
  if (req.method == 'GET') {
    switch (req.query['tip']) {
      case 'email_not_exist':
        var tip = "邮箱不存在";
        break;
      case 'success':
        var tip = "密码已发送成功请去邮箱验证";
        break;
      case 'error':
        var tip = "网络异常，请稍后再试";//此错误表示服务器问题,只要是数据库的err 统一发送此错误
        break;
      case 'sendfail':
        var tip = "发送失败，请稍后再试";//此错误表示邮件服务有问题
        break;
      default:
        var tip = null;
        break;
    }
    return res.render('user/forgetPassword', {tip: tip});
  } else if (req.method == "POST") {
    //判断邮箱存在否
    db.user.findOne({'email': req.body.email}, function (err, result) {
      if (!err) {
        if (result) {
          var rand = Math.floor(Math.random() * 90000000);//随机生成一个数字
          var randPwd = Date.now() + rand;
          var newPassword = util.md5(String(randPwd));
          result.password = newPassword;
          delete result._id;
          db.user.update({"email": req.body.email}, {'$set': result}, function (err) {
            if (err) {
              res.redirect('/user/forgetPassword?tip=error');
            } else {
              //如果邮箱存在，则发送密码
              util.sendMail({
                to: req.body.email,
                subject: '餐库新密码',
                text: '你的新密码是：' + randPwd + '，请用此密码登陆后尽快修改密码'
              }, function (err) {
                if (err) return res.redirect('/user/forgetPassword?tip=sendfail');
                res.redirect('/user/forgetPassword?tip=success');
              });
            }
          });
        } else {
          res.redirect('/user/forgetPassword?tip=email_not_exist');
        }
      } else {
        res.redirect('/user/forgetPassword?tip=error');
      }
    })
  }
}

// URL: /user/order/delete/:id
exports.user_deleteOrder = function (req, res) {
  id = req.params.id;
  db.order.findOne({"_id": db.ObjectID.createFromHexString(id)}, function (err, order) {
    if (err) return res.send(err);
    if (order.user_name == req.session.user.name) {
      db.order.update({"_id": db.ObjectID.createFromHexString(id)}, {"$set": {"canceled": "true"}}, function (err, result) {
        if (err) return res.send("取消订单失败");
        res.redirect('/today');
      });
    } else {
      res.send("你没有权限取消别人的订餐");
    }
  });
}

// URL: /404
exports.pageNotFound = function (req, res) {
  console.log('404 handler..');
  res.render('404', {status: 404, title: '页面不存在'});
};
