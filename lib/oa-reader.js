module.exports = function (oaDistroLocation) {

	var async = require('async'),
		_ = require('underscore'),
		fs = require('fs-extra')
		path = require('path');

	// returns the list of postcode sectors found in the OA distro
	// TODO: is it worth memoizing this?
	var readOaPostcodeSectors = function (callback) {
		fs.readdir(oaDistroLocation, function (err, entries) {
			async.filter(entries, function (entry, callback) {
				fs.stat(path.join(oaDistroLocation, entry), function (err, stats) {
					// console.log(entry, stats.isFile());
					callback(stats.isFile() && (path.extname(path.join(oaDistroLocation, entry)) === '.json'));
				});
			}, function (results) {
				callback(null, results.map(function (result) { return path.basename(path.join(oaDistroLocation, result), '.json'); }));
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
				fs.readJson(path.join(oaDistroLocation, relevantOaSector + '.json'), function (err, addresses) {
					callback(null, addresses.filter(function (address) {
						return address.address.postcode.name === postcode;
					}));
				});
			}
		});
	};

	return {
		'readOaPostcodeSectors': readOaPostcodeSectors,
		'readOaAddressesByPostcode': readOaAddressesByPostcode,
	};

}
