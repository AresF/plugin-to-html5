addKiller("Dailymotion", {

"canKill": function(data) {
	return data.src.indexOf("/dmplayerv4/") !== -1 || data.src.indexOf("www.dailymotion.com") !== -1;
},

"process": function(data, callback) {
	var sequence = parseFlashVariables(data.params.flashvars).sequence;
	if(sequence) this.processConfig(decodeURIComponent(sequence), callback);
	else {
		var match = /\/swf\/(?:video\/)?([^&?#]+)/.exec(data.src);
		if(match) this.processVideoID(match[1], callback);
	}
},

"processConfig": function(config, callback) {
	var config = JSON.parse(config);
	if(!config.sequence || config.sequence.length === 0) return;
	
	var name = function(name) {return function(x) {return x.name === name;};};
	var base = config.sequence.filter(name("root"))[0].layerList.filter(name("background"))[0];
	var media = base.sequenceList.filter(name("main"))[0].layerList.filter(name("video"))[0].param;
	var params = base.sequenceList.filter(name("reporting"))[0].layerList.filter(name("reporting"))[0].param.extraParams;
	
	var sources = [];
	if(media.hd1080URL) sources.push({"url": media.hd1080URL.replace(/\\\//g,"/"), "format": "1080p MP4", "height": 1080, "isNative": true});
	if(media.hd720URL) sources.push({"url": media.hd720URL.replace(/\\\//g,"/"), "format": "720p MP4", "height": 720, "isNative": true});
	if(media.hqURL) sources.push({"url": media.hqURL.replace(/\\\//g,"/"), "format": "480p MP4", "height": 480, "isNative": true});
	if(media.sdURL) sources.push({"url": media.sdURL.replace(/\\\//g,"/"), "format": "360p MP4", "height": 360, "isNative": true});
	if(media.ldURL) sources.push({"url": media.ldURL.replace(/\\\//g,"/"), "format": "240p MP4", "height": 240, "isNative": true});
	
	var title = unescape(params.videoTitle.replace(/\+/g, " ").replace(/\\u/g, "%u").replace(/\\["'\/\\]/g, function(s){return s.charAt(1);})); // sic
	var poster = params.videoPreviewURL.replace(/\\\//g,"/");
	
	callback({"playlist": [{"title": title, "poster": poster, "sources": sources}]});
},

"processVideoID": function(videoID, callback) {
	var _this = this;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://www.dailymotion.com/sequence/full/" + videoID, true);
	xhr.addEventListener("load", function() {
		var callbackForEmbed = function(videoData) {
			videoData.playlist[0].siteInfo = {"name": "Dailymotion", "url": "http://www.dailymotion.com/video/" + videoID};
			callback(videoData);
		};
		_this.processConfig(xhr.responseText, callbackForEmbed);
	}, false);
	xhr.send(null);
}

});