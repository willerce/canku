/**
 * User: willerce
 * Date: 9/17/12
 * Time: 1:48 PM
 */

var main = require('./routes/main');
var user = require('./routes/user');
var admin = require('./routes/admin');
var dev = require('./routes/dev');
var pay = require('./routes/pay');

module.exports = function(app){

  app.get('/',  user.auth, main.index);
  app.get('/today', user.auth, main.today);
  app.get('/shop/:id', user.auth, main.shop);
  app.get('/get_shop', user.auth, main.get_shop);
  app.post('/submit_order', user.auth, main.submit_order);

  //user
  app.get('/user/login', user.login);
  app.post('/user/login', user.login);
  app.get('/user/logout', user.logout);
  app.get('/user/register', user.register);
  app.post('/user/register', user.register);
  app.get('/user/order', user.auth, user.order);
  app.get('/user/account', user.auth, user.account);
  app.post('/user/account', user.auth, user.account);

  app.get('/pay', user.auth, pay.index);
  app.get('/pay/today_order', user.auth, pay.today_order);

  //dev
  app.get('/devlog', dev.log);

  //admin
  app.get('/admin', user.auth_admin, admin.index);
  app.get('/admin/shop', user.auth_admin, admin.shop_index);
  app.get('/admin/shop/add', user.auth_admin, admin.shop_add);
  app.post('/admin/shop/add', user.auth_admin, admin.shop_add);
  app.get('/admin/shop/edit/:id', user.auth_admin, admin.shop_edit);
  app.post('/admin/shop/edit/:id', user.auth_admin, admin.shop_edit);
  app.get('/admin/food/add',user.auth_admin, admin.food_add);
  app.post('/admin/food/add',user.auth_admin, admin.food_add);
  app.get('/admin/food/edit/:id',user.auth_admin, admin.food_edit);
  app.post('/admin/food/edit/:id',user.auth_admin, admin.food_edit);
  app.get('/admin/user',user.auth_admin, admin.user_index);
  app.get('/admin/user/orders/:id',user.auth_admin, admin.user_orders);
  //super-admin :  delete user;change user permisson(isAdmin,canOperateShop)
  app.get('/admin/user/delete/:id',user.auth_super_admin, admin.user_delete);
  app.get('/admin/user/isAdmin/:id',user.auth_super_admin, admin.user_isAdmin);
  app.get('/admin/user/canOperateShop/:id',user.auth_super_admin, admin.user_operateShop);
  //404 hadle
  app.get('*', main.pageNotFound);
};
