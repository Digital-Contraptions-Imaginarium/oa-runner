module.exports = function (onspdNonTerminatedCsvFile) {

	var _ = require('underscore'),
		csv = require('csv'),
		fs = require('fs-extra');

	eval(fs.readFileSync(path.join(__dirname, 'lib', 'latlon.js')) + '');
	eval(fs.readFileSync(path.join(__dirname, 'lib', 'gridref.js')) + '');

	// Returns all postcodes whose centroid is not more than 'maxDistanceKm'
	// from any of the points specified. 
	// If 'latLonFunction' is not specified, it is assumed that 'points' is an 
	// array of LatLon objects as in Chris Veness' libraries; alternatively,
	// 'latLonFunction' is used to extract the LatLon from the point.
	var fetchNearbyPostcodes = function (points, latLonFunction, maxDistanceKm, callback) {
		if (!callback) {
			callback = maxDistanceKm;
			maxDistanceKm = latLonFunction;
			latLonFunction = function (point) { return point; };
		}
		csv()
			.from.path(onspdNonTerminatedCsvFile, {
				'columns': true,
				'delimiter': ',',
			})
			.to.array(function (data) {
				callback(null, data);	
			})
			.transform(function (row) {
				var latLon = OsGridRef.osGridToLatLong(new OsGridRef(row.oseast1m, row.osnrth1m)),
					closestPoints = _.filter(points, function (point) {
						return parseFloat(latLon.distanceTo(latLonFunction(point))) <= maxDistanceKm;
					}).sort(function (a, b) {
						return parseFloat(latLon.distanceTo(latLonFunction(a))) - parseFloat(latLon.distanceTo(latLonFunction(b)));
					}); 
				return closestPoints.length > 0 ? 
					{ 
						'pcd': row.pcd, 
						'lat': parseFloat(latLon.lat().toFixed(6)), 
						'lon': parseFloat(latLon.lon().toFixed(6)),
						'closestPoint': closestPoints[0]  
					} : 
					undefined;				
			});
	}

	return {
		'fetchNearbyPostcodes': fetchNearbyPostcodes,
	};

}