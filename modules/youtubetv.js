YoutubeTV = {};

YoutubeTV.Current = {};
YoutubeTV.Playing = [];
YoutubeTV.Youtube = require('./youtube');
YoutubeTV.Video = require('./video');
YoutubeTV.Local = require('./local');
YoutubeTV.OMX = require('./omx');
YoutubeTV.IPlayer = require('./iplayer');
YoutubeTV.Sockets = require('./sockets');
YoutubeTV.Scheduler = require('./scheduler');
YoutubeTV.Utils = require('./utils');

YoutubeTV.init = function(server){
	YoutubeTV.Sockets.init(server);
	YoutubeTV.Video.init();
}

module.exports = YoutubeTV;