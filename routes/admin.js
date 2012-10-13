/**
 * 管理中心
 * User: willerce
 * Date: 9/17/12
 * Time: 7:40 PM
 */

var db = require('../global').database;

db.bind('shop');
db.bind('food');

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};


exports.shop_index = function(req, res){
  db.shop.find({}).toArray(function(err, result){
    if(!err){
      res.render('admin/shop/index', {shops : result});
    }else{
      res.render('admin/shop/index',{});
    }
  });
};

exports.shop_add = function(req, res){
  if(req.method == "GET"){
    res.render('admin/shop/add');
  }
  else if(req.method == "POST"){
    var name = req.body.name;
    var address = req.body.address;
    var tel = req.body.tel;

    // TODO 这里需要做输入验证

    var shop = {
      'name': name,
      'address': address,
      'tel' : tel
    };

    db.shop.insert(shop,function(err, result){
      if(!err){
        console.log(result);
        res.redirect('/admin/shop');
      }
    });
  }
};

exports.shop_edit = function(req, res){
  if(req.method=="GET"){
    db.shop.findOne({"_id": db.ObjectID.createFromHexString(req.params.id)},function(err, shop){
      res.render('admin/shop/edit', {"shop":shop});
    });
  }else if(req.method == "POST"){
    var shop = {
      'name': req.body.name,
      'address': req.body.address,
      'tel' : req.body.tel
    };

    db.shop.update({"_id": db.ObjectID.createFromHexString(req.body.id)},{'$set' : shop}, function(err){
      if(err){
        console.log("err");
        res.redirect('/admin/shop?msg=error&action=edit');
      }else{
        res.redirect('/admin/shop?msg=success&action=edit');
      }
    })
  };
};

exports.food_add = function(req,res){
  if(req.method=='GET'){
    db.shop.findOne({'_id' : db.ObjectID.createFromHexString(req.query['shop_id'])}, function(err, shop){
      if(!err){
        //获取食品
        db.food.find({'shop_id':req.query['shop_id']}).toArray(function(err, foods){
          if(!err){
            res.render('admin/food/add', {'shop':shop, 'foods': foods});
          }else{
            console.log('获取店铺出错了，ID是：'+req.params.id);
            next();
          }
        });
      }else{
        console.log('获取店铺出错了，ID是：'+req.params.id);
      }
    });
  }else if(req.method=='POST'){
    var shop_id = req.body.id;
    var name = req.body.name;
    var price = req.body.price;
    var week = req.body.week;

    // TODO 这里需要做输入验证

    var food = {
      'name': name,
      'price': price,
      'shop_id': shop_id,
      'week': week
    };

    db.food.insert(food,function(err, result){
      if(!err){
        console.log(result);
        res.redirect('/admin/food/add?shop_id='+shop_id);
      }
    });
  }
}

exports.food_edit = function(req,res){
  if(req.method=="GET"){
    db.food.findOne({"_id": db.ObjectID.createFromHexString(req.params.id)},function(err, food){
      res.render('admin/food/edit', {"food":food});
    });
  }else{
    db.food.findOne({"_id": db.ObjectID.createFromHexString(req.params.id)},function(err, food){
      food.name = req.body.name;
      food.price = req.body.price;
      food.week = req.body.week;
      delete food._id;
      db.food.update({"_id": db.ObjectID.createFromHexString(req.params.id)},{'$set' : food}, function(err){
        if(err){
          console.log("err");
          res.redirect('/admin/food/edit/'+req.params.id+'?msg=error&action=edit');
        }else{
          res.redirect('/admin/food/edit/'+req.params.id+'?msg=success&action=edit');
        }
      });
    });
  }
}