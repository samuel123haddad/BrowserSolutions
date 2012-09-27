/*
<!---------------- iTK Customization ----------------------------------->

Script  : /lawson/portal/browserCheck.js
Author  : Shan Smith
Date    : 2012-07-10
Company : iTK Technologies

/lawson/portal/index.htm (include the calls)
    <script language="javascript" src="browserCheck.js"></script>

change onload to <body onload="checkBrowser(); portalOnLoad();"
<!---------------- iTK Customization ----------------------------------->
*/
var chromeVerMin = 20;
var firefoxVerMin = 13;
var operaVerMin = 12;
var safariVerMin = 5;
var IEVerMin = 6;
var BrowserDetect = {
	init: function () {
		this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
		this.version = this.searchVersion(navigator.userAgent)
			|| this.searchVersion(navigator.appVersion)
			|| "an unknown version";

	},
	searchString: function (data) {
		for (var i=0;i<data.length;i++)	{
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (dataString.indexOf(data[i].subString) != -1)
					return data[i].identity;
			}
			else if (dataProp)
				return data[i].identity;
		}
	},
	searchVersion: function (dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index == -1) return;
		return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
	},
	dataBrowser: [
		{
			string: navigator.userAgent,
			subString: "Chrome",
			identity: "Chrome"
		},
		{
			string: navigator.vendor,
			subString: "Apple",
			identity: "Safari",
			versionSearch: "Version"
		},
		{
			prop: window.opera,
			identity: "Opera",
			versionSearch: "Version"
		},
		{
			string: navigator.userAgent,
			subString: "Firefox",
			identity: "Firefox"
		},
		{
			string: navigator.userAgent,
			subString: "MSIE",
			identity: "Explorer",
			versionSearch: "MSIE"
		},

	]

};
BrowserDetect.init();


var browser = BrowserDetect.browser;
var version = parseInt(BrowserDetect.version,10);
var message = "\tThis application is designed to run on Internet Explorer Version " +IEVerMin+" & above.\n\nIt has also been tested to work with:\n\n\to Firefox version " +firefoxVerMin+ " and above.\n\to Chrome version "+chromeVerMin+" and above.\n\to Safari version " +safariVerMin+" and above.\n\nPress \"OK\" to install the latest version of " + browser + ",\nor press \"Cancel\" to return.";
var targetUrl = "http://www.lawson.com/";

function checkBrowser()
{
	if  (browser == "Chrome" ){
		if (version < chromeVerMin){
		var r=confirm(message);
			if (r==true)
			  {
			  window.location="http://www.google.com/chrome";
			  }
			else
			  {
			  window.location=targetUrl;
			  }
			}
	}
	else if (browser == "Safari" ){
		if (version < safariVerMin){
		var r=confirm(message);
			if (r==true)
			  {
			  window.location="http://www.apple.com/safari/";
			  }
			else
			  {
			  window.location=targetUrl;

			  }
			}
	}
	else if (browser == "Opera" ){
		if (version < operaVerMin){
		var r=confirm("message");
			if (r==true)
			  {
			  window.location="http://www.opera.com/download/";
			  }
			else
			  {
			  window.location=targetUrl;

			  }
			}
	}
	else if (browser == "Firefox" ){
		if (version < firefoxVerMin){
		var r=confirm(message);
			if (r==true)
			  {
			  window.location="http://www.mozilla.org/en-US/firefox/fx/#desktop";
			  }
			else
			  {
			  window.location=targetUrl;

			  }
		}
	}
	else if (browser == "Explorer" ){
		if (version < IEVerMin){
		var r=confirm(message);
			if (r==true)
			  {
			  window.location="http://windows.microsoft.com/en-US/internet-explorer/downloads/ie";
			  }
			else
			  {
			  window.location=targetUrl;

			  }
		}
	}
	else {
		var r=confirm("Browser not supported");
			if (r==true)
			  {
			  window.location="http://www.google.com/chrome";
			  }
			else
			  {
			  window.location=targetUrl;

			  }
	}

}