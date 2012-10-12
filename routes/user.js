/**
 * User: willerce
 * Date: 9/17/12
 * Time: 1:44 PM
 */

var util = require('../libs/util');
var config = require('../global').config;
var database = require('../global').database;

exports.login = function(req, res){
  if(req.method == "GET"){
    switch(req.query['tip']){
      case 'error':
        var tip = "用户名或密码错误，请重试";
        break
      default :
        var tip = null;
        break;
    }
    res.render('login',{tip:tip});
  }else if(req.method == "POST") {

    var name = req.body.name;
    var password = util.md5(req.body.password);

    // 向数据库查询用户
    database.collection('user').findOne({'name': name, 'password' : password}, function(err, user){
      if(!err){
        if(user!=null){
          util.gen_session(user.name, user.password, res);
          res.redirect('/');
        }else{
          res.redirect('login?tip=error')
        }
      }else{
        res.redirect('login?tip=error')
      }
    })
  }
};

exports.register = function(req, res){
  if(req.method == "GET"){
    switch(req.query['tip']){
      case 'notemtpy':
        var tip = "用户名和密码不可为空";
        break;
      case 'exists':
        var tip = "该用户名已经被使用，请重试";
        break;
      case 'failure':
        var tip = "注册失败，请重试";
        break
      default :
        var tip = null;
        break;
    }
    res.render('register',{tip:tip});
  } else if(req.method == "POST"){
    //获取用户的输入
    var name = req.body.name;
    var password = req.body.password;

    //验证用户空输入
    if(name=="" || password == ""){
      res.render('/register?tip=notemtpy', { tip: '用户名和密码不可为空'});
      return;
    }

    //该用户名是否已经存在
    database.collection('user').findOne({name:name}, function(err, result){
      if(result==null){

        // 密码进行MD5
        password = util.md5(password);

        // 向数据库保存用户的数据，并进行 session 保存
        database.collection('user').insert({'name': name, 'password' : password}, function(err, user){
          if(!err & user.length > 0){
            if(user.length>0){
              util.gen_session(user[0].name, user[0].password, res);
              req.session.user = user[0];
              res.redirect('/?tip=welcome');
            }else{
              res.redirect('/register?tip=failure')
            }
          }else{
            res.redirect('/register?tip=failure')
          }
        })
      }else{
        res.redirect('/register?tip=exists')
      }
    });
  }
};

exports.auth = function(req, res, next) {
  if (req.session.user) {
    return next();
  }
  else {
    var cookie = req.cookies[config.auth_cookie_name];
    if (!cookie){
      return res.redirect(config.login_path);
    }

    var auth_token = util.decrypt(cookie, config.session_secret);
    var auth = auth_token.split('\t');
    var user_name = auth[0];

    database.collection('user').findOne({'name' : user_name}, function(err, user){
      if (!err && user) {
        req.session.user = user;
        return next();
      }
      else{
        return res.redirect(config.login_path);
      }
    });
  }
};

exports.logout = function(req, res){
  req.session.destroy();
  res.clearCookie(config.auth_cookie_name, {
    path : '/'
  });
  res.redirect('/');
}