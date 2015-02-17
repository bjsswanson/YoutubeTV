var child_process = require('child_process');
var exec = child_process.exec;

var OMX = function(){
	function start( file, callback ) {
		stop(function () {
			var cmd = child_process.spawn("omxplayer", ["-o", "local", file]);
			console.log("Playing:", file.substr(0, 80));
			cmd.on('close', function (code, signal) {
				cmd.kill();
				if (code == 0 && callback) {
					callback();
				}
			});
		});
	};

	function stop( callback ) {
		exec('killall omxplayer', callback);
	};

	function getYoutubeUrl(video, callback) {
		var yt = child_process.spawn("youtube-dl", ["-f", "38/37/46/22/35/34/18/6/5/17/13", "-g", video]);
		var url = "";
		yt.stdout.on('data', function (data) {
			url += data.toString('utf8');
		});
		yt.stdout.on('close', function () {
			yt.kill();
			var realUrl = decodeURI(url).trim();
			callback(realUrl);
		});
	}

	stop(); // Clean up omxplayer on start
	expose = {
		start: start,
		stop: stop,
		getYoutubeUrl: getYoutubeUrl
	}

	return expose;
}();

module.exports = OMX;