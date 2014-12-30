module.exports = function (fitSdkLocation) {

	var async = require('async'),
		_ = require('underscore'),
		csv = require('csv'),
		exec = require('child_process').exec,
		fs = require('fs-extra')
		path = require('path');

	eval(fs.readFileSync(path.join(__dirname, 'lib', 'latlon.js')) + '');
	eval(fs.readFileSync(path.join(__dirname, 'lib', 'gridref.js')) + '');

	// Returns the list of points the course in the 'filename' .fit file is made
	// of.
	// Each point is made of 'distance' (in the course, in meters) and 
	// 'position', that is a LatLon as in Chris Veness' libraries.
	// If 'samplingDistance' is specified, only one point every at least
	// 'samplingDistance' meters in the course is returned. 'samplingDistance' 
	// is specified in meters.
	var fetchCourse = function (filename, samplingDistance, callback) {
		if (!callback) {
			callback = samplingDistance;
			samplingDistance = undefined;
		}
		if (!samplingDistance) {
			samplingDistance = 0.;
		}
		var tempFolder = '.' + Math.random().toString(36).substring(7);
		fs.ensureDirSync(path.join(__dirname, tempFolder));
		exec(
			'java -jar ' + path.join(fitSdkLocation, 'java', 'FitCSVTool.jar') + ' -i --data record -b "' + filename + '" "' + path.join(__dirname, tempFolder, 'temp.csv') + '"', 
			function (err, stdout, stderr) {
				var latestDistance = null;
				csv()
					.from.path(path.join(__dirname, tempFolder, 'temp_data.csv'), {
						'columns': true,
						'delimiter': ',',
					})
					.to.array(function (data) {
						fs.removeSync(path.join(__dirname, tempFolder));
						// remove duplicates (very difficult to find any anyway, 
						// with sampling and 6 decimal digits precision!)
						data = _.uniq(data, false, function (x) { return x.position.lat() + '_' + x.position.lon(); });
						callback(null, data);	
					})
					.transform(function (row) {
						var newRow = undefined;
						if (!latestDistance || (row["record.distance[m]"] - latestDistance >= samplingDistance)) {
							latestDistance = row["record.distance[m]"];
						    newRow = {
						    	'distance': parseFloat((row["record.distance[m]"] * 0.000621371192).toFixed(1)), // miles
						    	'position': new LatLon(
									// read more about converting semicircles to 
									// lat/lon at http://www.gps-forums.net/explanation-sought-concerning-gps-semicircles-t1072.html
									parseFloat((parseFloat(row["record.position_lat[semicircles]"]) / 11930464.71).toFixed(6)),
									parseFloat((parseFloat(row["record.position_long[semicircles]"]) / 11930464.71).toFixed(6))
								),
							};
						}
						return newRow;
					});
			}
		);
	}

	return {
		'fetchCourse': fetchCourse,
	};

}