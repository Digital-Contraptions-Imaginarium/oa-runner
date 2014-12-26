var async = require('async'),
	_ = require('underscore'),
	fs = require('fs');

eval(fs.readFileSync('latlon.js') + '');
eval(fs.readFileSync('gridref.js') + '');

var fetchNearbyPostcodes = function (homeLatLon, maxDistanceKm, callback) {
	maxDistanceKm = parseFloat(maxDistanceKm);
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
			var latLon = OsGridRef.osGridToLatLong(new OsGridRef(row.oseast1m, row.osnrth1m)),
				// why the h*ll Chris Veness' distanceTo function returns a 
				// string?
				distance = parseFloat(latLon.distanceTo(homeLatLon));
			if (distance <= maxDistanceKm) {
				row = {
					'pcds': row.pcds,
					'lat': latLon.lat(),
					'lon': latLon.lon(),
				};
			} else {
				row = undefined;
			}
			return row;
		});
}

// home is LatLon(51.759467, -0.577358);
fetchNearbyPostcodes(new LatLon(51.759467, -0.577358), .5, function (err, postcodes) {
	console.log(JSON.stringify(postcodes));
});