/**
 * User: willerce
 * Date: 9/17/12
 * Time: 1:01 PM
 */

var mongoskin = require('mongoskin');

exports.config = {
  session_secret: process.env.SESSION_SECRET || 'SESSION_SECRET',
  cookie_secret: process.env.COOKIE_SECRET ||'COOKIE_SECRET',
  auth_cookie_name: process.env.AUTH_COOKIE_NAME || 'canku_secret',
  login_path : '/user/login',
  time_zone : 8,
  admin_user_name : process.env.ADMIN_USER_NAME || 'admin'

};

exports.database = mongoskin.db(process.env.MONGOLAB_URI || "mongodb://localhost/canku");

//运行时的临时变量
exports.runtime = {};