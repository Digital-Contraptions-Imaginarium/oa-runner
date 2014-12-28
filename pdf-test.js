// lots of advice from http://www.feedhenry.com/server-side-pdf-generation-node-js/

var phantomJsSession;

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

var renderPdf = function (session, file, cb) {
	var page;
	try {
		session.createPage(function (_page) {
			page = _page;
      		page.set('paperSize', { 'format': 'A4' }, function () {
  				page.open('html/index.html', function (status) {
  					page.evaluate(function () {
						$('#test').html("This was added at runtime");
					}, function () {
						page.render(file, function() {
							page.close();
							page = null;
							return cb(null, file);
						});
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

process.on('exit', function(code, signal) {
	if(phantomJsSession) phantomJsSession.exit();
});

createPhantomSession(function (err, session) {
	renderPdf(session, 'file.pdf', function (err) {
		console.log('Done');
		process.exit(0);
	})
});