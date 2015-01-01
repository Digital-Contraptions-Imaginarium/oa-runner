// lots of advice from http://www.feedhenry.com/server-side-pdf-generation-node-js/
module.exports = function () {

	var path = require('path'),
		phantomJsSession;

	var createPhantomSession = function (cb) {
		if (phantomJsSession) {
			return cb(null, phantomJsSession);
		} else {
			require('phantom').create({ }, function(_session) {
				phantomJsSession = _session;
				return cb(null, phantomJsSession);
			});
	  	}
	};

	process.on('exit', function(code, signal) {
		if(phantomJsSession) phantomJsSession.exit();
	});

	var makePdf2 = function (surveyOption, currentPhantomJsSession, file, cb) {
		var page;
		try {
			currentPhantomJsSession.createPage(function (_page) {
				page = _page;
	      		page.set('paperSize', { 'format': 'A4' }, function () {
	  				page.open(path.join(__dirname, 'html', 'index.html'), function (status) {
	  					eval('var toBeExecutedInPhantomJs = function () { addSurveyOption(JSON.parse(\'' + JSON.stringify(surveyOption) + '\')); };');
	  					page.evaluate(toBeExecutedInPhantomJs, function () { 
							setTimeout(function () { 
									page.render(file, function() {
										page.close();
										page = null;
										return cb(null, file);
									}); 
								}, surveyOption.inferredAddresses.length * 1000);
	  					});
		  			});
				});
	    	});
		} catch(e) {
	    	try {
	      		if (page != null) {
	        		page.close(); // try close the page in case it opened but never rendered a pdf due to other issues
	      		}
	    	} catch(e) {
				// ignore as page may not have been initialised
	    	}
	    	return cb('Exception rendering pdf:' + e.toString());
	  	}
	};

	var makePdf = function (destinationFile, surveyOption, callback) {
		createPhantomSession(function (err, currentPhantomJsSession) {
			makePdf2(surveyOption, currentPhantomJsSession, destinationFile, callback);
		});
	};

	return {
		'makePdf': makePdf,
	};

}