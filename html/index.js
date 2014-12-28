var addInvestigationTask = function (address) {

	var makeQueryString = function (obj) {
		return Object.keys(obj).reduce(function(a,k){a.push(k+'='+encodeURIComponent(obj[k]));return a},[]).join('&');
	}

	var randomIdExists = Math.random().toString(36).substring(7),
		randomIdWrong = Math.random().toString(36).substring(7),
		randomIdDoesntexist = Math.random().toString(36).substring(7);
	$('#investigationTasksTable > tbody:last').after(
		'<tr>' +
			'<td>' + 
				address.pao + ', ' +
				(address.sao ? address.sao + ', ' : '') +
				address.street + '<br>' +
				(address.locality ? address.locality + '<br>' : '') +
				address.town + '<br>' +
				address.postcode +
			'</td>' +
			'<td class="qrtd"><div id="' + randomIdExists + '"></div><br>It\'s there, I can see it!</td>' + 
			'<td class="qrtd"><div id="' + randomIdWrong + '"></div><br>It\'s there but something\'s wrong...</td>' + 
			'<td class="qrtd"><div id="' + randomIdDoesntexist + '"></div><br>I can\'t find it.</td>' + 
		'</tr>');	
	[ { 'id': randomIdExists, 'api': 'exists'}, 
	  { 'id': randomIdWrong, 'api': 'wrong'},
	  { 'id': randomIdDoesntexist, 'api': 'doesntexist'} ].forEach(function (params) {
		new QRCode(document.getElementById(params.id), {
			'text': "http://someFictionalApi.openaddressesuk.org/" + params.api + "?" + makeQueryString(address),
			'width': 100,
			'height': 100,
			'colorDark': "#000000",
			'colorLight': "#ffffff",
			'correctLevel': QRCode.CorrectLevel.H
		});
	});
}