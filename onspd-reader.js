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
					// closestCoursePoint is not necessarily the course point that
					// is closer to the postcode being examined, but the first in
					// the course that is close enough
					closestPoint = _.find(points, function (point) {
						return parseFloat(latLon.distanceTo(latLonFunction(point))) <= maxDistanceKm;
					}); 
				return closestPoint ? 
					{ 
						'pcd': row.pcd, 
						'lat': parseFloat(latLon.lat().toFixed(6)), 
						'lon': parseFloat(latLon.lon().toFixed(6)),
						'closestPoint': closestPoint  
					} : 
					undefined;				
			});
	}

	return {
		'fetchNearbyPostcodes': fetchNearbyPostcodes,
	};

}