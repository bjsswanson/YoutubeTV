var config = require('../config');
var fs = require('fs');
var diskspace = require('diskspace');

function addLocalVideo(url, callback){
	if(url != undefined && url.length > 0){
		fs.exists(url, function(exists) {
			if (exists) {
				var n = url.lastIndexOf('/');
				var title = url.substring(n + 1);
				var id = title.replace(/\W/g, '');

				callback([{
					type: 'local',
					url: url,
					id: id,
					title: title,
					image: ''
				}]);
			}
		});
	}
};


//TODO: Refactor to traverse sub directories
var readFiles = function(dir, callback) {
	fs.readdir(dir, function(err, files){
		var results = [];
		if(files) {
			files.forEach(function (file) {
				if (showFile(file)) {
					var path = dir + '/' + file
					results.push({"name": file, "path": path});
				}
			});
		}

		if(callback){
			callback(results);
		}
	});
}

function showFile(file){
	var utils = YoutubeTV.Utils;
	return !utils.startsWith(file, ".")
		&& !utils.endsWith(file, "srt")
}

function freeSpace(path, callback) {
	diskspace.check(path, function (err, total, free, status) {
		var formattedSpace = humanReadableByteCount(free, false);
		callback(formattedSpace);
	});
}

function humanReadableByteCount(bytes, si) {
	var unit = si ? 1000 : 1024;
	if (bytes < unit) return bytes + " B";
	var exp = parseInt(Math.log(bytes) / Math.log(unit));
	var pre = (si ? "kMGTPE" : "KMGTPE").charAt(exp-1) + (si ? "" : "i");
	var b = bytes / Math.pow(unit, exp)
	return Math.round(b) + " " + pre + "B"
}

function deleteLocal(id){
	var omx = YoutubeTV.OMX;
	var subtitles = omx.subtitles(id);

	if(id) {
		fs.exists(id, function (exists) {
			if (exists) {
				fs.unlink(id);
			}
		});
	}

	if(subtitles) {
		fs.exists(subtitles, function (exists) {
			if (exists) {
				fs.unlink(subtitles);
			}
		});
	}
}

var expose = {
	addLocalVideo: addLocalVideo,
	freeSpace: freeSpace,
	readFiles: readFiles,
	deleteLocal: deleteLocal
};

module.exports = expose;
