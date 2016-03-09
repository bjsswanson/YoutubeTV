//TODO: Improve iPlayer queueing

var config = require('./config');
var express = require('express');
var expressHbs = require('express-handlebars');

var multer = require('multer');
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, config.mediaDir)
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname)
	}
});
var upload = multer({ storage: storage })

var app = express();
var server = app.listen(config.port);
server.timeout = 0;

var YoutubeTV = require('./modules/youtubetv');
YoutubeTV.init(server, config);

app.engine('hbs', expressHbs({extname:'hbs', defaultLayout:'main.hbs'}));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
	var local = YoutubeTV.Local;
	local.readFiles(config.mediaDir, function(files){
		local.freeSpace(config.mediaDir, function(freeSpace){
			res.render('index',
				{
					'playing' : YoutubeTV.Playing,
					'iPlayerQueue': YoutubeTV.IPlayerQueue,
					'files': files,
					'freeSpace': freeSpace
				}
			);
		});
	});
});

app.post('/upload', upload.any(), function (req, res, next) {})

console.log('Listening on port ' + config.port);