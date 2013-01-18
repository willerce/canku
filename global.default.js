/**
 * User: willerce
 * Date: 9/17/12
 * Time: 1:01 PM
 */

var mongoskin = require('mongoskin');

exports.config = {
  session_secret: process.env.SESSION_SECRET || 'SESSION_SECRET',
  cookie_secret: process.env.COOKIE_SECRET || 'COOKIE_SECRET',
  auth_cookie_name: process.env.AUTH_COOKIE_NAME || 'canku_secret',
  login_path: '/user/login',//用户登录地址
  time_zone: 8,//时区，不般不用改
  admin_user_name: process.env.ADMIN_USER_NAME || 'admin'
};


//mongodb settings for mongolab START
//如果使用 MongoLab 提供的 MongoDB 服务，请保留这个配置，否则，删除下面这一行
exports.db = mongoskin.db(process.env.MONGOLAB_URI || "mongodb://localhost/canku");//数据库连接串
//mongodb settings for mongolab END

//mongodb settings for appfog mongodb service START
//如果使用 Appfog 自带的 MongoDB服务，请使用以下配置
/*if (process.env.VCAP_SERVICES) {
 var env = JSON.parse(process.env.VCAP_SERVICES);
 var mongo = env['mongodb-1.8'][0]['credentials'];
 }
 else {
 var mongo = {
 "hostname": "localhost",
 "port": 27017,
 "username": "",
 "password": "",
 "name": "",
 "db": "noderce"
 }
 }
 var generate_mongo_url = function (obj) {
 obj.hostname = (obj.hostname || 'localhost');
 obj.port = (obj.port || 27017);
 obj.db = (obj.db || 'test');
 if (obj.username && obj.password) {
 return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
 } else {
 return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
 }
 };
 exports.db = mongoskin.db(generate_mongo_url(mongo));*/
//mongodb settings for appfog mongodb service END

//运行时的临时变量
exports.runtime = {};