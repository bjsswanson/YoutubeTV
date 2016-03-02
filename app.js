var express = require('express');
var expressHbs = require('express-handlebars');
var multer = require('multer');

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, USB_DRIVE + "/UPLOAD")
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname)
	}
});
var upload = multer({ storage: storage })
var app = express();

var port = 7000;
var server = app.listen(port);

server.timeout = 0;

var YoutubeTV = require('./modules/youtubetv');
YoutubeTV.IO = require('socket.io').listen(server);
YoutubeTV.init();

app.engine('hbs', expressHbs({extname:'hbs', defaultLayout:'main.hbs'}));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('index',
	  {
		  'playing' : YoutubeTV.Playing,
		  'files' : YoutubeTV.Local.readFiles(YoutubeTV.USBDRIVE),
		  'freeSpace': YoutubeTV.Local.freeSpace(YoutubeTV.USBDRIVE)
	  }
  );
});

app.post('/upload', upload.any(), function (req, res, next) {})

console.log('Listening on port ' + port);