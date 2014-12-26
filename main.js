var async = require('async'),
	_ = require('underscore'),
	fs = require('fs-extra')
	path = require('path');

eval(fs.readFileSync('latlon.js') + '');
eval(fs.readFileSync('gridref.js') + '');

var fetchNearbyPostcodes = function (referenceLatLons, maxDistanceMiles, callback) {
	referenceLatLons = [ ].concat(referenceLatLons); 
	maxDistanceKm = parseFloat(maxDistanceMiles) * 1.609344;
	var csv = require('csv');
	csv()
		.from.path('data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK.csv', {
			'columns': true,
			'delimiter': ',',
		})
		.to.array(function (data) {
			callback(null, data);	
		})
		.transform(function (row) {
			var latLon = OsGridRef.osGridToLatLong(new OsGridRef(row.oseast1m, row.osnrth1m));
			if (_.some(referenceLatLons, function (referenceLatLon) {
				return parseFloat(latLon.distanceTo(referenceLatLon)) <= maxDistanceKm;
			})) {
				row = {
					'pcds': row.pcds,
					'lat': latLon.lat(),
					'lon': latLon.lon()
				};
			} else {
				row = undefined;
			}
			return row;
		});
}

var fetchCourse = function (filename, callback) {
	var csv = require('csv'),
		exec = require('child_process').exec,
		tempFolder = '.' + Math.random().toString(36).substring(7);
	fs.ensureDirSync(path.join(__dirname, tempFolder));
	exec(
		'java -jar etc/FitSDKRelease13.10/java/FitCSVTool.jar -i --data record -b "' + filename + '" "' + path.join(__dirname, tempFolder, 'temp.csv') + '"', 
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
/*
fetchNearbyPostcodes([ 
			new LatLon(51.759467, -0.577358), 
			// new LatLon(51.764541, -0.562041) 
		], .1, function (err, postcodes) {
	console.log(JSON.stringify(postcodes));
});
*/

fetchCourse('data/fit-samples/2014-12-24-11-11-15-Navigate.fit', function (err, data) {
	console.log(data);
});
