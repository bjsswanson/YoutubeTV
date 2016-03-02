var fs = require('fs');
var child_process = require('child_process');

var IPLAYER_FOLDER = YoutubeTV.USBDRIVE + "/IPLAYER";

YoutubeTV.IPlayerQueue = [];

function playIPlayer(id, callback){
	findIPlayerFile(id, function(iPlayerFile){
		YoutubeTV.OMX.start(iPlayerFile, callback);
	})
}

function downloadIPlayer(video){
	findIPlayerFile(video.id, function(iPlayerFile){
		if(!iPlayerFile) {
			console.log("Adding iPlayer video for download")
			YoutubeTV.IPlayerQueue.push(video);
			if(YoutubeTV.IPlayerQueue.push(video) === 1){
				processIPlayerQueue();
			}
		}
	});
}

function processIPlayerQueue() {
	if(YoutubeTV.IPlayerQueue.length > 0){
	   	var next = YoutubeTV.IPlayerQueue[0];
		console.log("Downloading iPlayer video: ", next.url);
		downloadIPlayerFiles(next.url, function(){
			YoutubeTV.IPlayerQueue.pop();
			processIPlayerQueue();
		});
	}
}

function downloadIPlayerFiles(url, callback){
	var subs = child_process.spawn("get_iplayer", [url, "--subtitles-only", "--output", IPLAYER_FOLDER]);
	subs.on('exit', function(){
		var video = child_process.spawn("get_iplayer", [url, "--raw", "--output", IPLAYER_FOLDER]);
		video.on('exit', function(){
			callback();
		})
	})
}

function findIPlayerFile(id, callback) {
	fs.readdir(IPLAYER_FOLDER, function (err, files) {
		var iPlayerFile;
		if (files) {
			files.forEach(function (element) {
				if (YoutubeTV.Utils.contains(element, id) && YoutubeTV.Utils.endsWith(element, "flv")) {
					iPlayerFile = IPLAYER_FOLDER + "/" + element;
				}
			});
		}
		callback(iPlayerFile);
	});
}

var expose = {
	playIPlayer: playIPlayer,
	downloadIPlayer: downloadIPlayer
}

module.exports = expose;
