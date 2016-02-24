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
        if(file.lastIndexOf("/", 0) === 0 || file === "temp.mp4"){
            var path = file.substr(0, file.lastIndexOf('.')) + ".srt";
            var exists = fs.existsSync(path);
            if(exists){
                return path;
            }
        }
    };

	function stop( callback ) {
		exec('pkill -f omxplayer' , callback);
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

	function streamIPlayer(url){
		var video_pipe = fs.createWriteStream('temp.mp4');
		var iplayer = child_process.spawn("get_iplayer", [url]);
		iplayer.stdout.pipe(video_pipe);

		//var subtitle_pipe = fs.createWriteStream('temp.srt');
		//var subtitles = child_process.spawn("get_iplayer", [url, "--subtitles-only", "--nowrite", "--stream"]);
		//subtitles.stdout.pipe(subtitle_pipe);

		start("temp.mp4", function(){
			stopIPlayer();
		});
	}

	function stopIPlayer( callback ) {
		exec('pkill -f get_iplayer' , callback);
	};

	stop(); // Clean up omxplayer on start
	expose = {
		start: start,
		stop: stop,
        subtitles: subtitles,
		getYoutubeUrl: getYoutubeUrl,
		streamIPlayer: streamIPlayer,
		stopIPlayer: stopIPlayer
	}

	return expose;
}();

module.exports = OMX;