var express = require('express');
var app = express();

var port = 3000;

var expressHbs = require('express-handlebars');

app.engine('hbs', expressHbs({extname:'hbs', defaultLayout:'main.hbs'}));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('index');
});

console.log('Listening on port ' + port);

var YoutubeTV = require('./yttv-server');
YoutubeTV.IO = require('socket.io').listen(app.listen(port));
YoutubeTV.OMX = require('./omxcontrol');
YoutubeTV.Sockets.init();