// TODO: I've used many ..Sync functions for simplicity, they must go
// TODO: why does .toFixed return a string?

var async = require('async'),
	_ = require('underscore'),
	fs = require('fs-extra')
	path = require('path'),
	argv = require('yargs')
		.demand([ 'oa', 'onspd', 'deviation', 'sample' ])
		// The default max deviation between the course and the surrounding
		// postcode centroids is 50 yards (~46 meters). The smaller this value, 
		// the less we are diverting the runner from her course to check an 
		// address.
		.default('deviation', 50.) // yards
		// The default course sample is 220 yards. On a ~3 miles run this 
		// filters the course from a few thousands down to about 25 points. 
		// The combination of 50 yards distance and 220 yards sample identifies
		// 23 candidate postcodes on @giacecco's standard hometown run
		// (e.g. http://dico.im/145XqiJ ). 
		.default('sample', 220.) // yards 
		// of the identified options, which should go to the PDF? the default is
		// the best one
		.default('option', 1)
		.check(function (argv) {
			var ok = !argv.fit || (argv.fit && argv.fitsdk) || false;
			if (!ok) throw new Error('If specifying --fit, the location of the Fit SDK must be specified, too, using --fitsdk.');
		})
		.check(function (argv) {
			var ok = (!argv.lat && !argv.lon && !argv.distance) || (argv.lat && argv.lon && argv.distance) || false;
			if (!ok) throw new Error("The --lat, --lon and --distance parameters must be specified together.");
		})
		.check(function (argv) {
			var ok = argv.fit || argv.lat || false;
			if (!ok) throw new Error("You must either specify the starting position (--lat, --lon and --distance) or the preferred course (--fit).");
		})
		.argv,
	onspdReader = new require('./lib/onspd-reader')(argv.onspd),
	oaReader = new require('./lib/oa-reader')(argv.oa),
	inferenceEngine = new require('./lib/toy-inference')(),
	pdfMaker = new require('./lib/pdf-maker')();

// This test script identifies the addresses known to Open Addresses that are 
// at the target distance / closer to the middle of the specified course. 
// TODO: the sorting below is useless when not using the --fit option, perhaps
// I should make the code work properly rather than by chance here
var generateSurveyingOptions = function (coursePostcodes, callback) {
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

var stage2 = function (points, latLonFunction, minDistanceKm, maxDistanceKm) {
	onspdReader.fetchNearbyPostcodes(
		points, 
		{ 
			'latLonFunction': latLonFunction, 
		  	'minDistanceKm': minDistanceKm, 
		  	'maxDistanceKm': maxDistanceKm, 
		},
		function (err, coursePostcodes) {
			generateSurveyingOptions(coursePostcodes, function (err, investigationOptions) {
				async.reduce(investigationOptions, [ ], function (memo, o, callback) {
					inferenceEngine.doTheInferenceMagic(o.relevantOaAddresses, function (err, inferredAddresses) {
						// unless at least one address is inferred, drop the 
						// postcode from the investigation options
						if (inferredAddresses.length > 0) {
							o.inferredAddresses = inferredAddresses;
							memo = memo.concat(o);
						}
						callback(null, memo);
					});
				}, function (err, investigationOptions) {
					if (argv.pdf) {
						// if the --pdf argument is specified, the top survey
						// option goes to the PDF file specified
						pdfMaker.makePdf(argv.pdf, investigationOptions[Math.max(0, Math.min(investigationOptions.length - 1, argv.option - 1))], function (err) { 
							// note that the pdf-maker library requires the process to exit explicitly
							process.exit(0);
						});
					} else {
						// otherwise all survey options are printed in JSON 
						// format to standard output
						console.log(JSON.stringify(investigationOptions));
						process.exit(0);
					}
				});
			});
		});
}

var stage1 = function () {
	if (argv.fit) {
		// the user has requested to find survey options around a.fit course
		var fitReader = new require('./lib/fit-reader')(argv.fitsdk);
		fitReader.fetchCourse(argv.fit, parseFloat(argv.sample) * 0.9144, function (err, points) {
			stage2(
				points, 
				function (point) { return point.position; }, 
				0., 
				parseFloat(argv.deviation) * 0.0009144
			);
		});
	} else if (argv.lat && argv.lon && argv.distance) {
		// the user has requested to find survey options at a given distance
		// from a starting point
		eval(fs.readFileSync(path.join(__dirname, 'lib', 'latlon.js')) + '');
		// Note the calculation below. I need to transform the target return
		// run length into an 'as the crow flies' ray, in order to find the 
		// target postcodes. As this is supposed to be an 'urban run', I presume
		// that they ray is the hypotenuse of a right angle and the sum of the
		// two sides is what the runner will actually have to run, twice (to and
		// back).  
		var searchAreaRayKm = Math.sqrt((parseFloat(argv.distance) * 1.609344 / 2 / 2) ^ 2 * 2);
		stage2(
			[ new LatLon(parseFloat(argv.lat), parseFloat(argv.lon)) ], 
			function (point) { return point; }, 
			searchAreaRayKm - parseFloat(argv.deviation) * 0.0009144, 
			searchAreaRayKm + parseFloat(argv.deviation) * 0.0009144
		);
	} else {
		// you should never get here thanks to the yargs checks
	}
}

// home is LatLon(51.759467, -0.577358);
// Berkhamsted station is LatLon(51.764541, -0.562041);
stage1();
