var main = require('./routes/main');
var admin = require('./routes/admin');
var api = require('./routes/api');

module.exports = function (app) {

  // main
  app.get('/', main.auth, main.index);
  app.get('/today', main.auth, main.today);
  app.get('/shop/:id', main.auth, main.shop);
  app.post('/submit_order', main.auth, main.submit_order);
  app.get('/pay/item', main.auth, main.pay_item);
  app.get('/pay/submit_pay', main.auth, main.submit_pay);
  app.post('/pay/submit_pay', main.auth, main.submit_pay);
  app.get('/user/login', main.login);
  app.post('/user/login', main.login);
  app.get('/user/logout', main.logout);
  app.get('/user/register', main.register);
  app.post('/user/register', main.register);
  app.get('/user/order', main.auth, main.user_order);
  app.get('/user/order/delete/:id', main.auth, main.user_deleteOrder);
  app.get('/user/account', main.auth, main.user_account);
  app.post('/user/account', main.auth, main.user_account);
  app.get('/user/balance', main.auth, main.user_balance);
  app.get('/user/forgetPassword', main.user_forgetPassword);
  app.post('/user/forgetPassword', main.user_forgetPassword);

  // admin
  app.get('/admin', main.auth_admin, admin.index);
  app.get('/admin/shop', main.auth_admin, admin.shop_index);
  app.get('/admin/shop/add', main.auth_admin, admin.shop_add);
  app.post('/admin/shop/add', main.auth_admin, admin.shop_add);
  app.get('/admin/shop/edit/:id', main.auth_admin, admin.shop_edit);
  app.post('/admin/shop/edit/:id', main.auth_admin, admin.shop_edit);
  app.get('/admin/shop/delete/:id', main.auth_admin, admin.shop_delete);
  app.get('/admin/food/add', main.auth_admin, admin.food_add);
  app.post('/admin/food/add', main.auth_admin, admin.food_add);
  app.get('/admin/food/edit/:id', main.auth_admin, admin.food_edit);
  app.get('/admin/food/delete/:id', main.auth_admin, admin.food_delete);
  app.post('/admin/food/edit/:id', main.auth_admin, admin.food_edit);
  app.get('/admin/user', main.auth_admin, main.auth_super_admin, admin.user_index);
  app.get('/admin/user/orders', main.auth_admin, main.auth_super_admin, admin.user_orders);
  app.get('/admin/user/add_balance', main.auth_admin, main.auth_super_admin, admin.user_add_balance);
  app.post('/admin/user/add_balance', main.auth_admin, main.auth_super_admin, admin.user_add_balance);
  app.get('/admin/user/balance', main.auth_admin, main.auth_super_admin, admin.balance);
  app.get('/admin/user/delete/:id', main.auth_admin, main.auth_super_admin, admin.user_delete);
  app.get('/admin/user/isAdmin/:id', main.auth_admin, main.auth_super_admin, admin.user_isAdmin);
  app.get('/admin/user/canOperateShop/:id', main.auth_admin, main.auth_super_admin, admin.user_operateShop);

  // api
  app.get('/api/today', api.today);

  //404 hadle
  app.get('*', main.pageNotFound);
};
