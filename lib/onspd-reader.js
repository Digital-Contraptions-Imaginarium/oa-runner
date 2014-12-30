module.exports = function (onspdNonTerminatedCsvFile) {

	var _ = require('underscore'),
		csv = require('csv'),
		fs = require('fs-extra');

	eval(fs.readFileSync(path.join(__dirname, 'latlon.js')) + '');
	eval(fs.readFileSync(path.join(__dirname, 'gridref.js')) + '');

	// Returns all postcodes whose centroid is not more than 'maxDistanceKm'
	// from any of the points specified. 
	// If 'latLonFunction' is not specified, it is assumed that 'points' is an 
	// array of LatLon objects as in Chris Veness' libraries; alternatively,
	// 'latLonFunction' is used to extract the LatLon from the point.
	var fetchNearbyPostcodes = function (points, options, callback) {
		if (!callback) {
			callback = options;
			options = { };
		}
		if (!options.minDistanceKm) options.minDistanceKm = 0.;
		if (!options.latLonFunction) options.latLonFunction = function (point) { return point; };
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
						var distance = parseFloat(latLon.distanceTo(options.latLonFunction(point)));
						return (distance >= options.minDistanceKm) && (distance <= options.maxDistanceKm);
					}).sort(function (a, b) {
						return parseFloat(latLon.distanceTo(options.latLonFunction(a))) - parseFloat(latLon.distanceTo(options.latLonFunction(b)));
					}); 
				return closestPoints.length > 0 ? 
					{ 
						'pcd': row.pcd, 
						'position': latLon,
						'closestPoint': closestPoints[0]  
					} : 
					undefined;				
			});
	}

	return {
		'fetchNearbyPostcodes': fetchNearbyPostcodes,
	};

}