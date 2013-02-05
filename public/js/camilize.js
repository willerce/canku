$.fn.camilize=function(opt){
  opt = $.extend({
    //todo: add more default options
    btnClass:'',
    btnText: 'use my camera',
    btnStopClass:'',
    btnStopText: 'take a picture',
    width:640,
    height:480,
    mime: 'image/jpeg',
    error:function(){}
  },opt);
  $(this).filter('input[type="file"]').each(function(i,e){
    $self = $(e);
    var cur_stream,$video = $('<video autoplay width="'+opt.width+'" height="'+opt.height+'"></video>').insertAfter($self).hide(),
      $canvas = $('<canvas width="'+opt.width+'" height="'+opt.height+'"></canvas>').insertAfter($self).hide(),
      $btn = $('<a href="#">'+opt.btnText+'</a>').addClass(opt.btnClass).insertAfter($self).click(function(e){
        e.preventDefault();
        if(!(navigator.getUserMedia||navigator.webkitGetUserMedia)){
          return opt.error(new Error('Browser not support! '));
        } 
        var userMedia = (function(done, err){
          try{
            if (navigator.getUserMedia){
              return navigator.getUserMedia({video: true}, done, err).bind(navigator);
            }
            if (navigator.webkitGetUserMedia){
              return navigator.webkitGetUserMedia({video: true}, done, err).bind(navigator);
            }
          } catch(e){}
        })(function(stream){
          cur_stream = stream;
          var source = stream;
          if(window.webkitURL){
            source = window.webkitURL.createObjectURL(source);
          }
          $canvas.hide();
          $video.show()[0].src = source;
          $btnStop.show();
          $btn.hide();
        }, function(err){
          opt.error(err);
        });
        
      }),
      $btnStop = $('<a href="#">'+opt.btnStopText+'</a>').addClass(opt.btnStopClass).hide().insertAfter($self).click(function(e){
        e.preventDefault();
        cur_stream.stop();
        var context = $canvas[0].getContext('2d');
        context.clearRect(0, 0);
        context.drawImage($video[0], 0, 0, opt.width, opt.height);
        $canvas.show();
        $video.hide();
        $btnStop.hide();
        $btn.show();
        var $old = $self;
        $self= $('<input type="hidden"/>').attr('name',$old.attr('name')).insertAfter($old);
        $old.remove();
        $self.val($canvas[0].toDataURL(opt.mime));
      });

  });
};
