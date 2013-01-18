/**
 * User: willerce
 * Date: 9/17/12
 * Time: 1:44 PM
 */

var util = require('../libs/util');
var config = require('../global').config;
var db = require('../global').database;
var dateformat = require('dateformat');

db.bind('order');
db.bind('user');

exports.login = function (req, res) {
  if (req.method == "GET") {
    //只要访问了登录页，就清除cookie
    res.clearCookie(config.auth_cookie_name, {
      path:'/'
    });
    switch (req.query['tip']) {
      case 'error':
        var tip = "帐号或密码错误，请重试";
        break;
      default :
        var tip = null;
        break;
    }
    res.render('user/login', {tip:tip});
  } else if (req.method == "POST") {

    var reMail = /^(?:[a-zd]+[_\-+.]?)*[a-zd]+@(?:([a-zd]+-?)*[a-zd]+.)+([a-z]{2,})+$/i;
    var account = req.body.account;
    var password = util.md5(req.body.password);

    var query = null;

    if (reMail.test(account)) {
      //使用邮箱登录
      query = {'email':account.toLowerCase(), 'password':password}
    } else {
      //使用名号登录
      query = {'name':account, 'password':password}
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
    res.render('user/register', {tip:tip});
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
    db.user.findOne({email:email}, function (err, name_result) {
      if (name_result == null) {//用户名未被使用
        //该用户名是否已经被使用
        db.user.findOne({name:name}, function (err, email_result) {

          if (email_result == null) {//邮箱未被使用

            /******************************
             * 可以注册了
             ******************************/

              // 密码进行MD5
            password = util.md5(password);
            var reg_time = util.getUTC8Time("YYYY-MM-DD HH:mm:ss");

            // 向数据库保存用户的数据，并进行 session 保存      /*添加管理权限字段 isAdmin canOperateShop*/
            db.user.insert({'name':name, 'email':email, reg_time:reg_time, 'password':password, 'isAdmin': false, 'canOperateShop': false}, function (err, user) {
              if (!err & user.length > 0) {
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

    db.user.findOne({'name':user_name}, function (err, user) {
      if (!err && user) {
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
  if (req.session.user && req.session.user.name != 'xx') {
    //如果用户有管理店铺的权限或者用户时超级管理员  才可以进入管理后台
    if (req.session.user.canOperateShop || req.session.user.isAdmin) {
      next();
    }else{
      return res.render('note',{title:'权限不够'});
    }
    
  } else {
    var cookie = req.cookies[config.auth_cookie_name];
    if (!cookie) {
      return res.redirect(config.login_path);
    }

    var auth_token = util.decrypt(cookie, config.session_secret);
    var auth = auth_token.split('\t');
    var user_name = auth[0];
    db.user.findOne({'name':user_name}, function (err, user) {
      if (!err && user) {
        req.session.user = user;
        if (req.session.user.name != 'xx') {
          //如果用户有管理店铺的权限或者用户时超级管理员  才可以进入管理后台
          if( user.canOperateShop || user.isAdmin ){
            return next()
          }else{
            return res.render('note',{title:'权限不够'})
          }          
        }
      }
      else {
        return res.redirect(config.login_path);
      }
    });
  }
}
//验证用户是否是超级管理员，只有超级管理员才有删除用户，改变用户权限的权限
exports.auth_super_admin = function (req, res, next){
  if ( req.session.user && req.session.user.name != 'xx' ){
    if ( req.session.user.isAdmin ) {
      next();
    }else{
      return res.render('note',{title:'权限不够'});
    }
  }
  // } else {
  //   var cookie = req.cookies[config.auth_cookie_name];
  //   if (!cookie) {
  //     return res.redirect(config.login_path);
  //   }

  //   var auth_token = util.decrypt(cookie, config.session_secret);
  //   var auth = auth_token.split('\t');
  //   var user_name = auth[0];

  //   db.user.findOne({'name':user_name}, function (err, user) {
  //     if (!err && user) {
  //       req.session.user = user;
  //       if (req.session.user.name != 'xx') {
  //         if( user.isAdmin ){
  //           return next()
  //         }else{
  //           return res.render('note',{title:'权限不够'})
  //         }          
  //       }
  //     }
  //     else {
  //       return res.redirect(config.login_path);
  //     }
  //   });
  // }
}


exports.logout = function (req, res) {
  req.session.destroy();
  res.clearCookie(config.auth_cookie_name, {
    path:'/'
  });
  res.redirect('/user/login');
}

// URL /user/order
exports.order = function (req, res) {
  //获取当前用户的ID{user_id:req.session.user._id}
  db.order.find({user_id:req.session.user._id.toString()}).sort({time:-1}).toArray(function (err, result) {
    if (!err) {
      res.render('user/order', {orders:result});
    }
    ;
  });
};

// URL /user/account
exports.account = function (req, res) {

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
    db.user.findOne({'name':req.session.user.name}, function (err, result) {
      if (!err) {
        result.email = result.email || "";
        res.render('user/account', {user:result, tip:tip});
      }
    });
  } else {
    if (req.method == "POST") {

      //修改帐号
      db.user.findOne({'name':req.session.user.name}, function (err, result) {
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
          db.user.findOne({'name':result.name}, function (err, user_name_exist) {
            if (!err) {
              //名号未被使用
              if (( user_name_exist != null && user_name_exist._id.id == result._id.id) || user_name_exist == null) {
                //验证邮箱是否已经被使用
                db.user.findOne({'email':result.email}, function (err, user_email_exist) {
                  if (!err) {
                    //邮箱未被使用
                    if (( user_email_exist != null && user_email_exist._id.id == result._id.id) || user_email_exist == null) {
                      var _id = result._id;
                      delete result._id;

                      db.user.update({"_id":_id}, {'$set':result}, function (err) {
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
  ;
};
