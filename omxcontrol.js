var child_process = require('child_process');
var exec = child_process.exec;

var OMX = function(){
	var lock = false; // Not sure if I need the lock. Try without and see what spamming does.

	function start( file, callback ) {
		if(!lock) {
			lock = true;
			stop(function () {
				var cmd = 'omxplayer -o local "' + file + '"';
				console.log("Playing:", cmd.substr(0, 80));
				exec(cmd, function () {
					callback();
				});

				lock = false;
			});
		}
	};

	function stop( callback ) {
		exec('killall omxplayer.bin', callback);
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
}