// TODO: I've used many ..Sync functions for simplicity, they must go
// TODO: why does .toFixed return a string?

var async = require('async'),
	_ = require('underscore'),
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
		.argv,
	fitReader = new require('./fit-reader')(argv.fitsdk),
	onspdReader = new require('./onspd-reader')(argv.onspd),
	oaReader = new require('./oa-reader')(argv.oa),
	inferenceEngine = new require('./toy-inference.js')();

// This test script identifies the addresses known to Open Addresses that are 
// closer to the middle of the course 
var generateInvestigationOptions = function (coursePostcodes, callback) {
	// the ideal postcode to be investigated is in the middle of the course; in
	// a way the entire course can be seen as a run to the postcode to be
	// investigated and back
	var idealCoursePostcodeDistance = Math.max.apply(null, coursePostcodes.map(function (p) { return p.closestPoint.distance; })) / 2.;
	async.reduce(coursePostcodes, [ ], function (memo, coursePostcode, callback) {
		// I fetch all addresses OA knows in that postcode
		oaReader.readOaAddressesByPostcode(coursePostcode.pcd, function (err, addresses) {
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
			return Math.abs(a.postcode.closestPoint.distance - idealCoursePostcodeDistance) - Math.abs(b.postcode.closestPoint.distance - idealCoursePostcodeDistance);
		}));
	});
};


// home is LatLon(51.759467, -0.577358);
// Berkhamsted station is LatLon(51.764541, -0.562041);
fitReader.fetchCourse(argv.fit, parseFloat(argv.sample) * 0.9144, function (err, points) {
	onspdReader.fetchNearbyPostcodes(
		points, 
		{ 
			'latLonFunction': function (point) { return point.position; }, 
		  	'maxDistanceKm': parseFloat(argv.distance) * 0.0009144, 
		},
		function (err, coursePostcodes) {
			generateInvestigationOptions(coursePostcodes, function (err, investigationOptions) {
				async.each(investigationOptions, function (o, callback) {
					inferenceEngine.doTheInferenceMagic(o.relevantOaAddresses, function (err, inferredAddresses) {
						o.inferredAddresses = inferredAddresses;
						callback(null);
					});
				}, function (err) {
					console.log(JSON.stringify(investigationOptions));
				});
			});
		});
});
