// the kind of inference this module does is really a joke, don't think this is
// in any way comparable to the stuff Open Addresses will do for its Beta
// stage!

module.exports = function () {

	var _ = require('underscore');

	// IMPORTANT: all addresses given as an input to this function must belong
	// to the same postcode
	var doTheInferenceMagic = function (oaAddresses, callback) {
		var inferredAddresses = [ ];
		_.uniq(oaAddresses.map(function (a) {
			return a.address.street.url;
		})).forEach(function (streetUrl) {
			// for each unique street
			var streetAddresses = oaAddresses.filter(function (a) { return a.address.street.url === streetUrl; }),
				paosAndSaos = oaAddresses.reduce(function (memo, a) {
					return _.uniq(memo.concat([ a.address.pao, a.address.sao ]));
				}, [ ]).filter(function (x) { return x; }),
				numericPaosAndSaosWithoutLetters = paosAndSaos.reduce(function (memo, a) {
					if (a.match(/(\d+).*/)) {
						memo.push(parseInt(a.match(/(\d+).*/)[1]));
					}
					return memo;
				}, [ ]);
			if (numericPaosAndSaosWithoutLetters.length > 1) {
				// can't do any inference of this kind if I don't have at least
				// two numbers belonging to the same street
				var max = Math.max.apply(null, numericPaosAndSaosWithoutLetters),
					min = Math.min.apply(null, numericPaosAndSaosWithoutLetters),
					// infer all house numbers without letters between the min 
					// and the max and removing the ones I know already
					inferredPaos = _.difference(
						_.range(min + 1, max).map(function (x) { return x.toString(); }), 
						paosAndSaos.filter(function (a) { return a.match(/\d+/); })
					),
					addressPrototype = JSON.parse(JSON.stringify(_.find(oaAddresses, function (a) { return a.address.street.url === streetUrl; })));
				// the inferred addresses cannot have an URI, as that is 
				// assigned by OA
				addressPrototype.address.url = undefined;
				// and the inferred house number will be assigned as the PAO,
				// the SAO are all nullified
				addressPrototype.address.sao = undefined;
				inferredAddresses = inferredAddresses.concat(inferredPaos.map(function (houseNumber) {
					var newAddress = JSON.parse(JSON.stringify(addressPrototype));
					newAddress.address.pao = houseNumber.toString();
					return newAddress;
				}));
			}
		});
		callback(null, inferredAddresses);
	}

	return {
		'doTheInferenceMagic': doTheInferenceMagic,
	};

}

/*
var fs = require('fs-extra'),
	test = new module.exports(),
	existingAddresses = fs.readJsonSync('investigationOptions-50yards-220yards.json')[1].relevantOaAddresses;
test.doTheInferenceMagic(existingAddresses, function (err, inferredAddresses) {
	console.log(JSON.stringify(inferredAddresses));
});
*/