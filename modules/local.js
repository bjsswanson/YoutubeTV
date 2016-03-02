var YoutubeTV = require('./youtubetv');
var fs = require('fs');
var diskspace = require('diskspace');

var readFiles = function(dir) {
	var results = [];
	try {
		var list = fs.readdirSync(dir)
		list.forEach(function(file) {
			if (showFile(file)) {
				file = dir + '/' + file
				var stat = fs.statSync(file)
				if (stat && stat.isDirectory()) {
					results = results.concat(readFiles(file))
				} else {
					results.push({"name": YoutubeTV.Utils.substringAfterLast(file, "/"), "path" : file});
				}
			}
		});
	} catch (err) {
		console.log(err)
	}

	return results
}

function showFile(file){
	return !YoutubeTV.Utils.startsWith(file, ".")
		&& !YoutubeTV.Utils.endsWith(file, "srt")
}

function freeSpace( path ) {
	diskspace.check(path, function (err, total, free, status) {
		var formattedSpace = humanReadableByteCount(free, false);
		YoutubeTV.FreeSpace = formattedSpace;
	});
	return YoutubeTV.FreeSpace;
}

function humanReadableByteCount(bytes, si) {
	var unit = si ? 1000 : 1024;
	if (bytes < unit) return bytes + " B";
	var exp = parseInt(Math.log(bytes) / Math.log(unit));
	var pre = (si ? "kMGTPE" : "KMGTPE").charAt(exp-1) + (si ? "" : "i");
	var b = bytes / Math.pow(unit, exp)
	return Math.round(b) + " " + pre + "B"
}

var expose = {
	readFiles: readFiles,
	freeSpace: freeSpace
};

freeSpace(YoutubeTV.USBDRIVE);

module.exports = expose;
