addKiller("Vimeo", {

"canKill": function(data) {
	return data.src.indexOf("vimeo.com/moogaloop") !== -1 || data.src.indexOf("vimeocdn.com/p/flash/moogalo") !== -1;
},

"process": function(data, callback) {
	var videoID;
	if(data.params.flashvars) videoID = parseFlashVariables(data.params.flashvars).clip_id;
	if(!videoID) {
		var match = /clip_id=([^&]+)/.exec(data.src);
		if(match) videoID = match[1];
	}
	if(!videoID) return;
	
	var xhr = new XMLHttpRequest();
	xhr.open('GET', "http://vimeo.com/moogaloop/load/clip:" + videoID + "/local/", true);
	xhr.onload = function() {
		var xml = xhr.responseXML;
		
		var url = "http://vimeo.com/moogaloop/play/clip:" + videoID + "/" + xml.getElementsByTagName("request_signature")[0].textContent + "/" + xml.getElementsByTagName("request_signature_expires")[0].textContent + "/?q=";
		
		var handleMIMEType = function(MIMEType) {
			var isNative = MIMEType === "video/mp4";
			var sources = [];
			
			if(xml.getElementsByTagName("isHD").length > 0 && xml.getElementsByTagName("isHD")[0].textContent === "1") {
				var height = 720;
				if(xml.getElementsByTagName("height")[0] && xml.getElementsByTagName("height")[0].textContent === "1080") height = 1080;
				if(isNative || canPlayFLV) sources.push({"url": url + "hd", "format": height + "p " + (isNative ? "MP4" : "FLV"), "height": height, "isNative": isNative});
			}
			if(isNative || canPlayFLV) sources.push({"url": url + "sd", "format": "360p " + (isNative ? "MP4" : "FLV"), "height": 360, "isNative": isNative});
			var handleMIMEType = function(MIMEType) {
				if(MIMEType === "video/mp4") sources.push({"url": url + "mobile", "format": "Mobile MP4", "height": 240, "isNative": true});
				
				var title, posterURL, siteInfo;
				if(xml.getElementsByTagName("caption").length > 0) {
					title = xml.getElementsByTagName("caption")[0].textContent;
				}
				if(xml.getElementsByTagName("thumbnail").length > 0) {
					posterURL = xml.getElementsByTagName("thumbnail")[0].textContent;
				}
				if(data.location.indexOf("vimeo.com/") === -1 || data.location === "http://vimeo.com/" || data.location.indexOf("player.vimeo.com/") !== -1) siteInfo = {"name": "Vimeo", "url": "http://vimeo.com/" + videoID};
				
				callback({"playlist": [{
					"siteInfo": siteInfo,
					"title": title,
					"poster": posterURL,
					"sources": sources
				}]});
			};
			getMIMEType(url + "mobile", handleMIMEType);
		};
		getMIMEType(url + "sd", handleMIMEType);
	};
	xhr.send(null);
}

});
