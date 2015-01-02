var csv = require('csv'),
	fs = require('fs-extra'),
	path = require('path'),
	argv = require('yargs')
		.demand([ 'in', 'out' ])
		.argv;

eval(fs.readFileSync(path.join(__dirname, '..', 'lib', 'latlon.js')) + '');
eval(fs.readFileSync(path.join(__dirname, '..', 'lib', 'gridref.js')) + '');

var centreLatLon;
if (argv.lat && argv.lon && argv.limit) {
	centreLatLon = new LatLon(parseFloat(argv.lat), parseFloat(argv.lon));
	argv.limit = parseFloat(argv.limit) * 1.609344; // km
}
csv()
	.from.path(argv.in, {
		'columns': true,
		'delimiter': ',',
	})
	.to.path(argv.out, { 'header': true })
	.transform(function (row) {
		if (row.doterm !== '') {
			row = undefined;
		} else {
			var latLon = OsGridRef.osGridToLatLong(new OsGridRef(row.oseast1m, row.osnrth1m));
			row.lat = latLon.lat();
			row.lon = latLon.lon();
			if (centreLatLon) {
				var distance = parseFloat(latLon.distanceTo(centreLatLon));
				if (distance > argv.limit) row = undefined;
			}
		}
		return row;
	});