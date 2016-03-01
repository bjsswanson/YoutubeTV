var YoutubeTV = require('./yttv-server');
var fs = require('fs');
var child_process = require('child_process');
var exec = child_process.exec;

var OMX = function(){
	function start( file, callback ) {
		stop(function () {
            var args = ["-o", "hdmi", file]

            var subs = subtitles(file);
            if(subs){
                args.push("--subtitles");
                args.push(subs);
            }

            console.log("args: ", args);

            var cmd = child_process.spawn("omxplayer", args);
			console.log("Playing:", file.substr(0, 80));
			cmd.on('exit', function (code, signal) {
				console.log("Exiting:", code, ",", signal);
				cmd.kill();
				if (code == 0 && callback) {
					callback();
				}
			});
		});
	};

    function subtitles( file ){
        if(file && file.lastIndexOf("/", 0) === 0){
            var path = file.substr(0, file.lastIndexOf('.')) + ".srt";
            var exists = fs.existsSync(path);
            if(exists){
                return path;
            }
        }
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

	function streamIPlayer(id, callback){
		findIPlayerFile(id, function(iPlayerFile){
			start(iPlayerFile, callback);
		})
	}

	function findIPlayerFile(id, callback) {
		fs.readdir("/media/pi/MOVIES/IPLAYER", function (err, files) {
			var iPlayerFile;
			if (files) {
				files.forEach(function (element) {
					if (YoutubeTV.Utils.contains(element, id) && YoutubeTV.Utils.endsWith(element, "mp4")) {
						iPlayerFile = element;
					}
				});
			}
			callback(iPlayerFile);
		});
	}

	function downloadIPlayer(url){
		findIPlayerFile(id, function(iPlayerFile){
			if(!iPlayerFile){
				child_process.spawn("get_iplayer", [url, "--output", "/media/pi/MOVIES/IPLAYER"]);
				child_process.spawn("get_iplayer", [url, "--subtitles-only", "--output", "/media/pi/MOVIES/IPLAYER"]);
			}
		})
	}

	function stopIPlayer(callback) {
		exec('pkill -f get_iplayer' , callback);
	}

	function stop( callback ) {
		exec('pkill -f omxplayer' , callback);
	};

	stop(); // Clean up omxplayer on start
	expose = {
		start: start,
		stop: stop,
        subtitles: subtitles,
		getYoutubeUrl: getYoutubeUrl,
		streamIPlayer: streamIPlayer,
		downloadIPlayer: downloadIPlayer,
		stopIPlayer: stopIPlayer
	}

	return expose;
}();

module.exports = OMX;