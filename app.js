var fs = require('fs')
var express = require('express');
var app = express();

var port = 7000;


var key = fs.readFileSync('api.key').toString();
var google = require('googleapis');
google.options({ auth: key });

var YoutubeTV = require('./yttv-server');
YoutubeTV.IO = require('socket.io').listen(app.listen(port));
YoutubeTV.OMX = require('./omxcontrol');
YoutubeTV.Youtube = google.youtube('v3');
YoutubeTV.Video.init();

var expressHbs = require('express-handlebars');

app.engine('hbs', expressHbs({extname:'hbs', defaultLayout:'main.hbs'}));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('index', { 'playing' : YoutubeTV.Playing });
});

console.log('Listening on port ' + port);

