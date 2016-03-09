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
	var sockets = YoutubeTV.Sockets;
	if(isIPlayer(video.url)) {
		findIPlayerFile(video.id, function (iPlayerFile) {
			if (!iPlayerFile) {
				console.log("Adding iPlayer video for download: " + video.url)
				iPlayerQueue.push(video);
				sockets.emit('iPlayerQueue', video);
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
		console.log("Downloading iPlayer video: ", next.url);
		downloadIPlayerFiles(next.url, function(){
			YoutubeTV.IPlayerQueue.shift();
			sockets.emit('iPlayerDone', next);
			processIPlayerQueue();
		});
	}
}

function downloadIPlayerFiles(url, callback){
	var subs = child_process.spawn("get_iplayer", [url, "--subtitles-only", "--output", config.mediaDir], { stdio: 'inherit' });
	subs.on('exit', function(){
		subs.kill();
		console.log('Subtitles downloaded: ', url);
		var video = child_process.spawn("get_iplayer", [url, "--raw", "--output", config.mediaDir], { stdio: 'inherit' });
		video.on('exit', function(){
			video.kill();
			console.log('Video downloaded: ', url);
			callback();
		})
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
