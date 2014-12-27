// TODO: why does .toFixed return a string?

var async = require('async'),
	_ = require('underscore'),
	csv = require('csv'),
	exec = require('child_process').exec,
	fs = require('fs-extra')
	path = require('path'),
	argv = require('yargs')
		.demand([ 'oa', 'onspd', 'fit', 'fitsdk', 'distance', 'sample' ])
		// The default max distance between the course and the surrounding
		// postcode centroids is 50 yards (~46 meters). The smaller this value, 
		// the less we are diverting the runner from her course to check an 
		// address.
		.default('distance', 50.) // yards
		// The default course sample is 220 yards. On a ~3 miles run this 
		// filters the course from a few thousands down to about 25 points. 
		// The combination of 50 yards distance and 220 yards sample identifies
		// 23 candidate postcodes on @giacecco's standard hometown run
		// (e.g. http://dico.im/145XqiJ ). 
		.default('sample', 220.) // yards 
		.alias('f', 'fit')
		.alias('o', 'onspd')
		.argv;

eval(fs.readFileSync(path.join(__dirname, 'lib', 'latlon.js')) + '');
eval(fs.readFileSync(path.join(__dirname, 'lib', 'gridref.js')) + '');

var fetchNearbyPostcodes = function (coursePoints, callback) {
	var maxDistanceKm = parseFloat(argv.distance) * 0.0009144; // kilometers
	csv()
		.from.path(argv.onspd, {
			'columns': true,
			'delimiter': ',',
		})
		.to.array(function (data) {
			callback(null, data);	
		})
		.transform(function (row) {
			var latLon = OsGridRef.osGridToLatLong(new OsGridRef(row.oseast1m, row.osnrth1m)),
				// closestCoursePoint is not necessarily the course point that
				// is closer to the postcode being examined, but the first in
				// the course that is close enough
				closestCoursePoint = _.find(coursePoints, function (coursePoint) {
					return parseFloat(latLon.distanceTo(coursePoint.position)) <= maxDistanceKm;
				}); 
			return closestCoursePoint ? 
				{ 
					'pcd': row.pcd, 
					'lat': parseFloat(latLon.lat().toFixed(6)), 
					'lon': parseFloat(latLon.lon().toFixed(6)),
					'courseDistance': closestCoursePoint.distance // the distance in the runner's course 
				} : 
				undefined;				
		});
}

var fetchCourse = function (filename, callback) {
	var SAMPLING_DISTANCE = parseFloat(argv.sample) * 0.9144, // meters
		tempFolder = '.' + Math.random().toString(36).substring(7);
	fs.ensureDirSync(path.join(__dirname, tempFolder));
	exec(
		'java -jar ' + path.join(argv.fitsdk, 'java', 'FitCSVTool.jar') + ' -i --data record -b "' + filename + '" "' + path.join(__dirname, tempFolder, 'temp.csv') + '"', 
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
					if (!latestDistance || (row["record.distance[m]"] - latestDistance >= SAMPLING_DISTANCE)) {
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


// home is LatLon(51.759467, -0.577358);
// Berkhamsted station is LatLon(51.764541, -0.562041);

/*
fetchCourse(argv.fit, function (err, points) {
	fetchNearbyPostcodes(points, function (err, postcodes) {
		console.log(JSON.stringify(postcodes));
	});
});
*/

var postcodeSectors = fs.readdirSync(argv.oa)
	.filter(function (p) { return fs.statSync(path.join(argv.oa, p)).isFile() && (path.extname(path.join(argv.oa, p)) === '.json'); })
	.map(function (p) { return path.basename(path.join(argv.oa, p), '.json').toUpperCase(); });
console.log(postcodeSectors);

