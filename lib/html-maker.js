module.exports = function () {

	var fs = require('fs-extra'),
		path = require('path'),
		_ = require('underscore');

	var makeHtml = function (htmlFile, surveyOption, callback) {
		fs.readFile(path.join(__dirname, 'html', 'index.html'), { 'encoding': 'utf8' }, function (err, template) {
			template = _.template(template);
			fs.writeFile(htmlFile, template({ 'surveyOption': JSON.stringify(surveyOption) }), callback);
		});
	}

	return {
		'makeHtml': makeHtml,
	}

}