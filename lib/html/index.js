var addSurveyTask = function (oaAddress, callback) {

	var randomIdExists = Math.random().toString(36).substring(7),
		randomIdWrong = Math.random().toString(36).substring(7),
		randomIdDoesntexist = Math.random().toString(36).substring(7);
	$('#surveyTasksTable > tbody:last').after(
		'<tr>' +
			'<td>' + 
				oaAddress.address.pao + ', ' +
				(oaAddress.address.sao ? oaAddress.address.sao + ', ' : '') +
				oaAddress.address.street.name.en[0] + '<br>' +
				(oaAddress.address.locality.name.en[0] ? oaAddress.address.locality.name.en[0] + '<br>' : '') +
				oaAddress.address.town.name.en[0] + '<br>' +
				oaAddress.address.postcode.name +
			'</td>' +
			'<td class="qrtd"><div id="' + randomIdExists + '"></div><br>It\'s there, I can see it!</td>' + 
			'<td class="qrtd"><div id="' + randomIdWrong + '"></div><br>It\'s there but something\'s wrong...</td>' + 
			'<td class="qrtd"><div id="' + randomIdDoesntexist + '"></div><br>I can\'t find it.</td>' + 
		'</tr>');
	async.eachSeries(	
		[ { 'id': randomIdExists, 'api': 'exists'}, 
		  { 'id': randomIdWrong, 'api': 'wrong'},
		  { 'id': randomIdDoesntexist, 'api': 'doesntexist'} ],
		function (params, callback) {
			new QRCode(document.getElementById(params.id), {
				// TODO: the one below is just a random URL, waiting for Open 
				// Addresses to specify a suitable API
				'text': "http://someFictionalApi.openaddressesuk.org/" + params.api + "?address=" + encodeURIComponent(Math.random().toString(36).substring(7)),
				'width': 100,
				'height': 100,
				'colorDark': "#000000",
				'colorLight': "#ffffff",
				'correctLevel': QRCode.CorrectLevel.H
			});
			// waits until I see the QR code has the expected size, checks
			// every second
			async.whilst(
				function () { return $('#' + params.id).find('img').css('display') === 'none'; },
				function (callback) { 
					// console.log(params.id + ": am I here at least once?");
					setTimeout(function () { callback(null); }, 500); },
				callback
			);
	},
		function (err) {
			if (callback) callback(err);
		}
	);
}

function addSurveyOption (surveyOption) {
	surveyOption.inferredAddresses.forEach(function (oaAddress) {
		addSurveyTask(oaAddress);
	});
};