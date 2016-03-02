var fs = require('fs');
var child_process = require('child_process');

var IPLAYER_FOLDER = YoutubeTV.USBDRIVE + "/IPLAYER";

function streamIPlayer(id, callback){
	findIPlayerFile(id, function(iPlayerFile){
		YoutubeTV.OMX.start(iPlayerFile, callback);
	})
}

function findIPlayerFile(id, callback) {
	fs.readdir(IPLAYER_FOLDER, function (err, files) {
		var iPlayerFile;
		if (files) {
			files.forEach(function (element) {
				if (YoutubeTV.Utils.contains(element, id) && YoutubeTV.Utils.endsWith(element, "flv")) {
					iPlayerFile = path + "/" + element;
				}
			});
		}
		callback(iPlayerFile);
	});
}

function downloadIPlayer(url, id){
	findIPlayerFile(id, function(iPlayerFile){
		if(!iPlayerFile){
			child_process.spawn("get_iplayer", [url, "--raw", "--output", IPLAYER_FOLDER], { stdio: 'inherit' });
			child_process.spawn("get_iplayer", [url, "--subtitles-only", "--output", IPLAYER_FOLDER], { stdio: 'inherit' });
		}
	})
}

var expose = {
	streamIPlayer: streamIPlayer,
	downloadIPlayer: downloadIPlayer
}

module.exports = expose;
