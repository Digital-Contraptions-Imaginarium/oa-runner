var async = require('async'),
	_ = require('underscore'),
	fs = require('fs'),
	parse = require('csv-parse'),
	transform = require('stream-transform');

var output = [],
	parser = parse({ 'delimiter': ',' }),
	input = fs.createReadStream('data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK.csv'),
	transformer = transform(function (record, callback) {
  		setTimeout(function () {
    		callback(null, record.join(' ') + '\n');
  		}, 500);
	}, {parallel: 10});
input.pipe(parser).pipe(transformer).pipe(process.stdout);