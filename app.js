
/**
 * Module dependencies.
 */
//'use strict';

var express = require('express');
var http = require('http');
var path = require('path');
var routes = require('./routes');
var config = require('./global').config;

var app = express();
var MemStore = express.session.MemoryStore;

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({secret: config.session_secret, store: MemStore({
    reapInterval: 60000 * 10
  })}));
  app.use(express.static(path.join(__dirname, 'public')));
});

//app.dynamicHelpers
app.use(function(req, res, next){
  res.locals.session = req.session;
  next();
});
app.use(app.router);

app.configure('development', function(){
  app.use(express.errorHandler());
});

routes(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});