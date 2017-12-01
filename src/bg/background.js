// new http header parameters to override
var newHeader = {
	referer: {
		name: "Referer",
		value: "https://www.twitter.com", // or "https://www.facebook.com"
	},
	cookie: {
		name: "Cookie",
		value: ""
	},
	cachecontrol: {
		name: "Cache-Control",
		value: "max-age=0"
	}
};

// sites that we want to access
var sites = {
	washingtonpost: {
		js: [
			"*://*.washingtonpost.com/*pwapi/*.js*", // this one causes paywall/ad-wall lightbox for every article
			"*://*.washingtonpost.com/*drawbridge/drawbridge.js?_*", // this one causes paywall/ad-wall lightbox sometimes with Adblock Plus enabled
		]
	},
	wsj: {
		url: "*://*.wsj.com/*",
		js: [
			"*://*/*cxense-candy.js", // this one causes a pop up advertisement for every article
		]
	},
	ft: {
		url: "*://*.ft.com/*",
	},
	nyt: {
		js: [
			"*://*.com/*mtr.js", // this one causes a pop up asking for subscription
		]
	},
	bloomberg: {
		url: "*://*.bloomberg.com/*",
		js: [
			"*://*.bwbx.io/s3/javelin/public/javelin/js/pianola/*",
		]
	}
};

// extract all script urls we want to block
var script_urls = Object.values(sites)
                .map(site => site.js)
                .filter(Array.isArray)
                .reduce((prev, curr) => prev.concat(curr), []);

// extract all main_frame urls we want to override
var main_frame_urls = Object.values(sites)
                    .map(site => site.url)
                    .filter(url => url);

blockJavascripts = function() {
	console.log("we are going to block some low energy javascripts");

	return { cancel: true };
}

blockHeaders = function(details) {
	console.log("we are going to override some request headers");

	// remove existing referer and cookie
	for (let i = 0; i < details.requestHeaders.length; i++) {
		if (details.requestHeaders[i].name === newHeader.referer.name || details.requestHeaders[i].name === newHeader.cookie.name) {
			details.requestHeaders.splice(i, 1);
			i--;
		}
	}
	// add new referer
	details.requestHeaders.push(newHeader.referer);
	// remove cache
	details.requestHeaders.push(newHeader.cachecontrol);

	return { requestHeaders: details.requestHeaders };
}

//If user is using Chrome
if (typeof browser !== "undefined"){
	browser.webRequest.onBeforeRequest.addListener(
		blockJavascripts,{
			urls: script_urls,
			// target is script
			types: [ "script" ]
		},
		[ "blocking" ]
	);

	browser.webRequest.onBeforeSendHeaders.addListener(
		blockHeaders, {
			urls: main_frame_urls,
			// target is the document that is loaded for a top-level frame
			types: [ "main_frame" ]
		},
		[ "blocking", "requestHeaders" ]
	);
} else { //They are using FF/Edge
	chrome.webRequest.onBeforeRequest.addListener(
		blockJavascripts,{
			urls: script_urls,
			// target is script
			types: [ "script" ]
		},
		[ "blocking" ]
	);

	chrome.webRequest.onBeforeSendHeaders.addListener(
		blockHeaders, {
			urls: main_frame_urls,
			// target is the document that is loaded for a top-level frame
			types: [ "main_frame" ]
		},
		[ "blocking", "requestHeaders" ]
	);
}