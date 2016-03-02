
var YoutubeTV = YoutubeTV || {};

var google = require('googleapis');
var key = require('fs').readFileSync(__dirname + '/../api.key').toString();
google.options({ auth: key });

YoutubeTV.USBDRIVE = "/media/pi/MOVIES";

YoutubeTV.Current = {};
YoutubeTV.Playing = [];
YoutubeTV.Youtube = google.youtube('v3');
YoutubeTV.Video = require('./video');
YoutubeTV.Local = require('./local');
YoutubeTV.OMX = require('./omx')
YoutubeTV.Utils = require('./utils')

YoutubeTV.init = function(){
	YoutubeTV.Video.init();
}

module.exports = YoutubeTV;