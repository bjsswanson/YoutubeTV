var config = require('../config');
var fs = require('fs');
var path = require('path');
var diskspace = require('diskspace');
var child_process = require('child_process');
var execFile = child_process.execFile;

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

function readFiles(dir, callback) {
	if(callback){
		execFile('find', [ dir, "-type", "f" ], function(err, stdout, stderr) {
			var file_list = stdout.split('\n');
			if(file_list){
				var filtered = [];

				file_list.forEach(function(file){
					file = path.normalize(file);
					parse = path.parse(file);

					if(showFile(parse.base)){
						filtered.push({"name": parse.name, "path" : file});
					}
				});

				callback(filtered);
			}
		});
	}
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
