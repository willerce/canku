/**
 * User: willerce
 * Date: 9/17/12
 * Time: 1:48 PM
 */

var main = require('./routes/main');
var user = require('./routes/user');
var admin = require('./routes/admin');

module.exports = function(app){

  app.get('/',  user.auth, main.index);
  app.get('/today', user.auth, main.today);
  app.get('/shop', user.auth, main.shop);
  app.get('/shop/:id', user.auth, main.shop_item);
  app.post('/submit_order', user.auth, main.submit_order);
  app.post('/submit_caller', user.auth, main.submit_caller);
  app.get('/order', user.auth, main.order);

  //user
  app.get('/login', user.login);
  app.post('/login', user.login);
  app.get('/logout', user.logout);
  app.get('/register', user.register);
  app.post('/register', user.register);


  //admin
  app.get('/admin', admin.index);
  app.get('/admin/shop', admin.shop_index);
  app.get('/admin/shop/add', admin.shop_add);
  app.post('/admin/shop/add', admin.shop_add);
  app.get('/admin/shop/edit/:id', admin.shop_edit);
  app.post('/admin/shop/edit/:id', admin.shop_edit);
  app.get('/admin/food/add',admin.food_add);
  app.post('/admin/food/add',admin.food_add);
  app.get('/admin/food/edit/:id',admin.food_edit);
  app.post('/admin/food/edit/:id',admin.food_edit);
};
