var csv = require('csv'),
	argv = require('yargs')
		.demand([ 'in', 'out' ])
		.argv;

csv()
	.from.path(argv.in, {
		'columns': true,
		'delimiter': ',',
	})
	.to.path(argv.out, { 'header': true })
	.transform(function (row) {
		return (row.doterm === '') ? row : undefined;
	});