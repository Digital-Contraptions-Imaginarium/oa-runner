// TODO: I've used many ..Sync functions for simplicity, they must go
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


// returns the list of postcode sectors found in the OA distro
// TODO: is it worth memoizing this?
var readOaPostcodeSectors = function (callback) {
	fs.readdir(argv.oa, function (err, entries) {
		async.filter(entries, function (entry, callback) {
			fs.stat(path.join(argv.oa, entry), function (err, stats) {
				// console.log(entry, stats.isFile());
				callback(stats.isFile() && (path.extname(path.join(argv.oa, entry)) === '.json'));
			});
		}, function (results) {
			callback(null, results.map(function (result) { return path.basename(path.join(argv.oa, result), '.json'); }));
		});
	});
};

// returns all addresses found in the OA distro for the specified postcode
var readOaAddressesByPostcode = function (postcode, callback) {
	readOaPostcodeSectors(function (err, oaAvailablePostcodeSectors) {
		var relevantOaSector = _.find(oaAvailablePostcodeSectors, function (sector) {
					return postcode.match(new RegExp('^' + sector));
				});
		if (!relevantOaSector) {
			callback(null, [ ]);
		} else {
			fs.readJson(path.join(argv.oa, relevantOaSector + '.json'), function (err, addresses) {
				callback(null, addresses.filter(function (address) {
					return address.address.postcode.name === postcode;
				}));
			});
		}
	});
};

// This test script identifies the addresses known to Open Addresses that are 
// closer to the middle of the course 
var generateInvestigationOptions = function (coursePostcodes, callback) {
	// the ideal postcode to be investigated is in the middle of the course; in
	// a way the entire course can be seen as a run to the postcode to be
	// investigated and back
	var idealCoursePostcodeDistance = Math.max.apply(null, coursePostcodes.map(function (p) { return p.courseDistance; })) / 2.;
	async.reduce(coursePostcodes, [ ], function (memo, coursePostcode, callback) {
		// I fetch all addresses OA knows in that postcode
		readOaAddressesByPostcode(coursePostcode.pcd, function (err, addresses) {
			if (addresses.length === 0) {
				callback(null, memo);
			} else {
				callback(null, memo.concat({
					'postcode': coursePostcode,
					'relevantOaAddresses': addresses,
				}));
			}
		});
	}, function (err, candidateInvestigations) {
		callback(err, candidateInvestigations.sort(function (a, b) { 
			// I sort candidate investigations by how close they are to that ideal 
			// distance
			return Math.abs(a.postcode.courseDistance - idealCoursePostcodeDistance) - Math.abs(b.postcode.courseDistance - idealCoursePostcodeDistance);
		}));
	});
};


// home is LatLon(51.759467, -0.577358);
// Berkhamsted station is LatLon(51.764541, -0.562041);
/*
fetchCourse(argv.fit, function (err, points) {
	fetchNearbyPostcodes(points, function (err, coursePostcodes) {
		generateInvestigationOptions(coursePostcodes, function (err, investigationOptions) {
			console.log(JSON.stringify(investigationOptions));
		});
	});
});
*/

generateInvestigationOptions(fs.readJsonSync('nearby-postcodes-course-50yards-220yards.json'), function (err, investigationOptions) {
	console.log(JSON.stringify(investigationOptions));
});
