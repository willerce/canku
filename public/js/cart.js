/**
 * 购物车功能
 * User: willerce
 * Date: 9/18/12
 * Time: 12:56 PM
 */

(function () {

  $(window).scroll(function () {
    var top = $(this).scrollTop();
    var top = 66 - top;
    if (top < 0) top = 0;
    $('#cart').css('top', top + "px");
  });

  var storage = window.localStorage;
  var shop_id = $('#shop_id').val();
  var shop_name = $('#shop_name').val();

  //购物车对象
  //从localstorage中取出已经点的美食
  var shopping_cart = [];
  if (storage.getItem(shop_id) != null) {
    shopping_cart = JSON.parse(storage.getItem(shop_id));
  }

  //遍历美食列表
  for (var i in shopping_cart) {
    $('#food-' + shopping_cart[i].id).addClass('checked');

    //创建购物篮
    var dom = $(create_car_item(shopping_cart[i]));
    //dom.find("option[value='"+shopping_cart[i].num+"']").attr("seleted", "true");
    dom.find('select').val(shopping_cart[i].num);
    dom.appendTo($('#cartTable tbody'));
  }

  //计算总价
  $("#cart_zongjia").text(get_total());

  //绑定份数修改事件
  $('.cart_o_num').change(changeNum);
  $('.del_btn').click(del_food);


  $('.food-list ul li').click(function () {
    var el = $(this);
    if (el.hasClass('checked')) {//已经选中-> 取消
      el.removeClass('checked');
      for (var i in shopping_cart) {
        if (shopping_cart[i].id == el.attr('data-id')) {
          $('#car-' + shopping_cart[i].id).remove();
          shopping_cart.splice(i, 1);
          //重设购物车
          storage.setItem(shop_id, JSON.stringify(shopping_cart));
        }
      }
    } else {//未选中
      el.addClass('checked');
      //构建对象
      var food = {
        id: el.attr('data-id'),
        name: el.attr('data-name'),
        price: el.attr('data-price'),
        num: 1,
      };
      //向数组添加
      shopping_cart.push(food);
      //向storage中保存
      storage.setItem(shop_id, JSON.stringify(shopping_cart));
      //向购物篮添加
      $(create_car_item(food)).appendTo($('#cartTable tbody'));
      //绑定份数修改事件
      $('.cart_o_num').change(changeNum);
      $('.del_btn').click(del_food);
    }

    //重新计算
    $("#cart_zongjia").text(get_total());
  });

  $('.buy-btn').click(function (e) {
    $('#car-confirm').reveal({
      animation: 'fadeAndPop',
      animationspeed: 300,
      closeonbackgroundclick: false,
      dismissmodalclass: 'close-reveal-modal'
    });

    if (shopping_cart.length <= 0 && $('#picmenu>.ui-draggable').length==0) {
      $('#confirm-list').empty().html("亲，不要着急，您还木有点菜呢！");
    } else {

      var dom = '<table width="100%">';

      for (var key in shopping_cart) {
        dom += '<td><td>' + shopping_cart[key].name + '<em class="price">' + shopping_cart[key].price + '元</em></td><td>' + shopping_cart[key].num + '份</td></tr>'
      }

      dom += '</table><div class="foot"><span class="total">共：' + get_total() + ' 元</span><button type="button" id="buy-go" class="btn">提交订单</button></div>';

      $('#confirm-list').empty().html(dom);

      // 构造图片菜单
      var picmenu_list = [];
      if($('#picmenu>.ui-draggable').each(function(i, e){
        var picmenu_item;
        picmenu_list.push(picmenu_item = {
          picmenu: $('#picmenu>img').attr('src'),
          width: $('#picmenu>img').width(),
          height: $('#picmenu>img').height(),
          left: -$(e).offset().left + $('#picmenu').offset().left,
          top: -$(e).offset().top + $('#picmenu').offset().top,
          itemwidth: $(e).width(),
          itemheight: $(e).height()
        });
        $('#picmenu>img').clone().css({
          position: 'absolute'
        }).css(picmenu_item).appendTo($('<div></div>').css({
          position: 'relative',
          width: picmenu_item.itemwidth,
          height: picmenu_item.itemheight,
          overflow: 'hidden'
        }).insertBefore('#buy-go'));
      }).length){
        $('<p>再加上：</p>').insertAfter('#confirm-list .total');
      }

      $('#buy-go').unbind('click').bind('click', function () {

        //禁用掉按钮，防止重复提交
        $(this).attr('disabled', 'disabled');

        //向后台提交订单
        $.ajax({
          type: "POST",
          url: "/submit_order",
          data: "list=" + JSON.stringify(shopping_cart) + "&picmenu=" + JSON.stringify(picmenu_list) +"&shop_name=" + shop_name + "&shop_id=" + shop_id,
          dataType: 'json',
          success: function (data) {
            if (data.result == "success") {
              //清空localstorage
              storage.removeItem(shop_id);
              $('#confirm-list').empty().html('<div style="text-align:center;"><p>订单提交成功，你的运气值：' + data.luck + '点</p><p>倒计时 <span class="timeout">6</span> 秒后 <a href="/today">跳转到今日订单</a></p></div>');

              var totaltime = 0;

              setInterval(function () {
                if (totaltime < 5) {
                  totaltime++;
                  $('#confirm-list .timeout').text(parseInt($('#confirm-list .timeout').text()) - 1);
                } else {
                  location.href = "/today";
                }
              }, 1000)

            }
          },
          error: function () {
            alert('下单出错了');
          }
        });
      });

    }
  });
  // 加载完咱才知道图片大小啊
  window.onload = function(){
    $('#picmenu').click(function(e){ 
      var x;
      var y;
      if (e.pageX || e.pageY) { 
        x = e.pageX;
        y = e.pageY;
      }
      else { 
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
      } 
      y -= $(this).offset().top;
      x -= $(this).offset().left;
      if(x + 100 < $(this).width() && y + 100 < $(this).height()){
        $('<div class=""><span class="close">X</span></div>').css({
          width: 100,
          height: 100,
          top: y,
          left: x,
          border: 'solid 1px black',
          position: 'absolute'
        }).draggable({
          containment: "#picmenu"
        }).resizable({
          containment: "#picmenu"
        })
        .appendTo('#picmenu').children('.close').css({
          float: 'right'
        }).click(function(){
          $(this).parent().remove();
          return false;
        })
      }
    });
  };

  function create_car_item(food) {
    return '<tr id="car-' + food.id + '" data-id="' + food.id + '"><td class="ttl">' + food.name + '</td><td width="40"><select class="cart_o_num">' +
      '<option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>' +
      '<option value="5">5</option><option value="6">6</option><option value="7">7</option><optionvalue="8">8</option></select></td><td class="del" width="30">' + food.price + '</td>' +
      '<td width="30"><a id="cart_del_' + food.id + '" class="del_btn" href="javascript:void(0);" title="不要">删除</a></td></tr>';
  }


  function get_total() {
    var price = 0.0;
    for (var i in shopping_cart) {
      price += (parseFloat(shopping_cart[i].price) * parseInt(shopping_cart[i].num));
    }
    return price;
  }

  function changeNum() {
    var food_id = $(this).parents('tr').attr('data-id');

    for (var i in shopping_cart) {
      if (shopping_cart[i].id == food_id) {
        shopping_cart[i].num = $(this).val();
        //重设购物车
        storage.setItem(shop_id, JSON.stringify(shopping_cart));
        //重新计算
        $("#cart_zongjia").text(get_total());
      }
    }
  };

  function del_food() {
    var food_id = $(this).parents('tr').attr('data-id');
    for (var i in shopping_cart) {
      if (shopping_cart[i].id == food_id) {
        shopping_cart.splice(i, 1);
        //重设购物车
        storage.setItem(shop_id, JSON.stringify(shopping_cart));
        $(this).parents('tr').remove();
        $('#food-' + food_id).removeClass('checked');
        //重新计算
        $("#cart_zongjia").text(get_total());
      }
    }
  }

})();

