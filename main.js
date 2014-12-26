var async = require('async'),
	_ = require('underscore'),
	fs = require('fs');

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

// home is LatLon(51.759467, -0.577358);
// Berkhamsted station is LatLon(51.764541, -0.562041);
fetchNearbyPostcodes([ 
			new LatLon(51.759467, -0.577358), 
			// new LatLon(51.764541, -0.562041) 
		], .1, function (err, postcodes) {
	console.log(JSON.stringify(postcodes));
});
