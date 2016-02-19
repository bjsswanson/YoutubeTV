var fs = require('fs')
var express = require('express');
var multer = require('multer');
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, '/media/pi/UPLOAD')
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname)
	}
})

var upload = multer({ storage: storage })
var app = express();
var port = 7000;

var server = app.listen(port);
server.timeout = 0;

var key = fs.readFileSync(__dirname + '/api.key').toString();
var google = require('googleapis');
google.options({ auth: key });

var YoutubeTV = require('./yttv-server');

YoutubeTV.IO = require('socket.io').listen(server);
YoutubeTV.OMX = require('./omxcontrol');
YoutubeTV.Youtube = google.youtube('v3');
YoutubeTV.Video.init();
YoutubeTV.Local.freeSpace("/media/pi/MOVIES");

var expressHbs = require('express-handlebars');

app.engine('hbs', expressHbs({extname:'hbs', defaultLayout:'main.hbs'}));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('index',
	  {
		  'playing' : YoutubeTV.Playing,
		  'files' : YoutubeTV.Local.readFiles("/media"),
		  'freeSpace': function(){
			  YoutubeTV.Local.freeSpace("/media/pi/MOVIES");
			  return YoutubeTV.FreeSpace;
		  }()
	  }
  );
});

app.post('/upload', upload.single('file'), function (req, res, next) {})

console.log('Listening on port ' + port);