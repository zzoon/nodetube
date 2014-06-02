
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , jsdom = require('jsdom')
  , request = require('request')
  , url = require('url')

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);

app.get('/watch/:id', function(req, res) {
  res.render('video', { title: 'Watch', vid: req.params.id });
});

app.get('/nodetube', function(req, res){
  //Tell the request that we want to fetch youtube.com, send the results to a callback function
  request({
    uri: 'http://youtube.com' 
  }, function(err, response, body) {
    var self = this;
    self.items = new Array(); //I feel like I want to save my results in an array
 
    //Just a basic error check
    if (err && response.statusCode !== 200) {
      console.log('Request error.'); 
    }

    //Send the body param as the HTML code we will parse in jsdom
    //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
    jsdom.env(
      body,
      ['http://code.jquery.com/jquery-1.6.min.js']
    , function(err, window){
      //Use jQuery just as in a regular HTML page
      var $ = window.jQuery;
 
      console.log($('title').text());
      //res.end($('title').text());

      var $body = $('body'),
      $videos = $body.find('.feed-item-main-content .yt-shelf-grid-item');
      //$videos = $body.find('.feed-item-visual-description');

      $videos.each(function(i, item) {
        var $item = $(item);
        var $description = $item.find('.yt-lockup-title > a');
        var $title = $description.text();
        var $a = $description.attr('href');
        var $time = $item.find('.yt-lockup-deemphasized-text').text();
        var $img = $item.find('span..yt-thumb-clip img');
        var $thumb = $img.attr('data-thumb') ? $img.attr('data-thumb') : $img.attr('src');

        self.items[i] = {
          href: $a,
          title: $title.trim(),
          time: $time,
          thumbnail: $thumb,
          urlObj: url.parse($a, true)
        }
      });

      console.log(self.items.length);

      res.render('list', {
	                       title: 'NodeTube',
						   items: self.items
	  });
      //res.end('Done');

    });
  });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

