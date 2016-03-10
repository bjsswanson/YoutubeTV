var config = require('../config');
var fs = require('fs');
var child_process = require('child_process');

YoutubeTV.IPlayerQueue = [];

function isIPlayer(url){
	return url.indexOf("http://www.bbc.co.uk/iplayer") > -1;
}

function addIPlayerVideo( url, callback ){
	var utils = YoutubeTV.Utils;
	if(url != undefined){
		var idAndTitle = utils.substringAfterLast(url, "episode/");
		var split = idAndTitle.split("/");

		var id = split.length > 0 ? split[0] : url;
		var title = split.length > 1 ? split[1] : url;

		callback([{
			type: 'iplayer',
			url: url,
			id: id,
			title: title,
			image: { url : "/images/iPlayer.png" }
		}]);

	}
};

function playIPlayer(id, callback){
	var omx = YoutubeTV.OMX;
	findIPlayerFile(id, function(iPlayerFile){
		omx.start(iPlayerFile, callback);
	})
}

function downloadIPlayer(video){
	var iPlayerQueue = YoutubeTV.IPlayerQueue;
	if(isIPlayer(video.url)) {
		findIPlayerFile(video.id, function (iPlayerFile) {
			if (!iPlayerFile) {
				console.log("Adding iPlayer video for download: " + video.url)
				iPlayerQueue.push({video: video, progress: "(0%)"});
				if (iPlayerQueue.length === 1) {
					processIPlayerQueue();
				}
			}
		});
	}
}

function processIPlayerQueue() {
	var iPlayerQueue = YoutubeTV.IPlayerQueue;
	var sockets = YoutubeTV.Sockets;
	if(iPlayerQueue.length > 0){
	   	var next = iPlayerQueue[0];
		console.log("Downloading iPlayer video: ", next.video.url);
		sockets.emit('iPlayerQueue', next);
		downloadIPlayerFiles(next, function(){
			YoutubeTV.IPlayerQueue.shift();
			sockets.emit('iPlayerDone', next);
			processIPlayerQueue();
		});
	}
}

function downloadIPlayerFiles(next, callback){
	var sockets = YoutubeTV.Sockets;
	var subs = child_process.spawn("get_iplayer", [next.video.url, "--subtitles-only", "--output", config.mediaDir], { stdio: 'inherit' });
	subs.on('exit', function(){
		subs.kill();
		console.log('Subtitles downloaded: ', next.video.url);

		var video = child_process.spawn("get_iplayer", [next.video.url, "--raw", "--output", config.mediaDir]);

		video.stdout.on('data', function(data){
			var str = data.toString();
			var progress = str.match(/\(([0-9]{1,3}\.[0-9])\%\)/g);
			if(progress){
				next.progress = progress[progress.length - 1];
				console.log(next.title, " - ", next.progress);
				sockets.emit('iPlayerProgress', next);
			}
		});

		video.on('exit', function(){
			video.kill();
			console.log('Video downloaded: ', next.video.url);
			callback();
		});
	})
}

function findIPlayerFile(id, callback) {
	var utils = YoutubeTV.Utils;
	fs.readdir(config.mediaDir, function (err, files) {
		var iPlayerFile;
		if (files) {
			files.forEach(function (element) {
				if (utils.contains(element, id) && utils.endsWith(element, "flv")) {
					iPlayerFile = config.mediaDir + "/" + element;
				}
			});
		}
		callback(iPlayerFile);
	});
}

var expose = {
	isIPlayer: isIPlayer,
	addIPlayerVideo: addIPlayerVideo,
	playIPlayer: playIPlayer,
	downloadIPlayer: downloadIPlayer
}

module.exports = expose;
