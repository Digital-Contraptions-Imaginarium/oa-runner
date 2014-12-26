var async = require('async'),
	_ = require('underscore'),
	fs = require('fs-extra')
	path = require('path'),
	argv = require('yargs')
		.demand([ 'onspd', 'fit', 'fitsdk', 'distance' ])
		.default('distance', .1) // miles
		.alias('f', 'fit')
		.alias('o', 'onspd')
		.argv;

eval(fs.readFileSync(path.join(__dirname, 'lib', 'latlon.js')) + '');
eval(fs.readFileSync(path.join(__dirname, 'lib', 'gridref.js')) + '');

var fetchNearbyPostcodes = function (referenceLatLons, maxDistanceMiles, callback) {
	referenceLatLons = [ ].concat(referenceLatLons); 
	maxDistanceKm = parseFloat(maxDistanceMiles) * 1.609344;
	var csv = require('csv');
	csv()
		.from.path(argv.onspd, {
			'columns': true,
			'delimiter': ',',
		})
		.to.array(function (data) {
			callback(null, data);	
		})
		.transform(function (row) {
			var latLon = OsGridRef.osGridToLatLong(new OsGridRef(row.oseast1m, row.osnrth1m));
			return _.some(referenceLatLons, function (referenceLatLon) {
					return parseFloat(latLon.distanceTo(referenceLatLon)) <= maxDistanceKm;
				}) ? 
					{ 
						'pcd': row.pcd, 
						'lat': parseFloat(latLon.lat().toFixed(6)), 
						'lon': parseFloat(latLon.lon().toFixed(6)) 
					} : 
					undefined;				
		});
}

var fetchCourse = function (filename, callback) {
	var csv = require('csv'),
		exec = require('child_process').exec,
		tempFolder = '.' + Math.random().toString(36).substring(7);
	fs.ensureDirSync(path.join(__dirname, tempFolder));
	exec(
		'java -jar ' + path.join(argv.fitsdk, '/java/FitCSVTool.jar') + ' -i --data record -b "' + filename + '" "' + path.join(__dirname, tempFolder, 'temp.csv') + '"', 
		function (err, stdout, stderr) {
			csv()
				.from.path(path.join(__dirname, tempFolder, 'temp_data.csv'), {
					'columns': true,
					'delimiter': ',',
				})
				.to.array(function (data) {
					fs.removeSync(path.join(__dirname, tempFolder));
					// remove duplicates (very difficult to find any, with 6 decimal digits)
					data = _.uniq(data, false, function (x) { return x.lat() + '_' + x.lon(); });
					callback(null, data);	
				})
				.transform(function (row) {
					// TODO: why does .toFixed return a string?
					return new LatLon(
						parseFloat((parseFloat(row["record.position_lat[semicircles]"]) / 11930464.71).toFixed(6)),
						parseFloat((parseFloat(row["record.position_long[semicircles]"]) / 11930464.71).toFixed(6))
					);
				});
		}
	);
}


// home is LatLon(51.759467, -0.577358);
// Berkhamsted station is LatLon(51.764541, -0.562041);

fetchCourse(argv.fit, function (err, points) {
	fetchNearbyPostcodes(points, parseFloat(argv.distance), function (err, postcodes) {
		console.log(JSON.stringify(postcodes));
	});
});