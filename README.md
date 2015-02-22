oa-runner
=========

oa-runner is a collection of scripts to support runners and ramblers who want to contribute to [Open Addresses UK](http://openaddressesuk.org) by surveying addresses that are located at a given distance or nearby their planned courses. *Oa-runner is not endorsed by Open Addresses*.

**NOTE: this is a working prototype only**, and Open Addresses is not yet ready to automatically process the outcome of your survey (when you scan the QR codes in the survey forms). You are very welcome to feedback and contribute, though: Please use this repository's [issues section](https://github.com/Digital-Contraptions-Imaginarium/oa-runner/issues).

##Run (literally... or walk)

Don't try this before you completed [setup](https://github.com/Digital-Contraptions-Imaginarium/oa-runner/blob/master/docs/setup.md).

###If you don't have a favourite course
The example below creates an HTML file called [*bestSurveyOption-distance.html*](samples/html/bestSurveyOption-distance.html) with the best survey option being identified to be about 3 miles (to and back) from the Open Addresses offices in London.

Note how the optimised version of the ONSPD dataset produced following the setup instructions above **must** be used as an input.

```
> node oarunner.js --lat=51.522342 --lon=-0.083476 --distance=3 --oa=data/open_addresses_database_2014-12-10-openaddressesuk-addresses-only-split.json/ --onspd=data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK_not_terminated.csv --html=bestSurveyOption-distance.html
```

###If you have a favourite course
If you own a fitness device that can save your activity data to *.fit* format, the example below creates a HTML file called [*bestSurveyOption-course.html*](samples/html/bestSurveyOption-course.html) with the best of the address survey options identified along the course specified in the *.fit* file provided as an input.

```
> node oarunner.js --fit=samples/fit/2014-12-24-11-11-15-Navigate.fit --fitsdk=etc/FitSDKRelease13.10/ --oa=data/open_addresses_database_2014-12-10-openaddressesuk-addresses-only-split.json/ --onspd=data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK_OAoffices.csv --html=bestSurveyOption-course.html
```

The underlying idea is that the volunteer's mission is to get to and back from the address to be surveyed. Because of that, when specifying a course the survey options are sorted by proximity to the middle of that course. If the volunteer doesn't want the top survey option but another one (perhaps she's run that already) she can use the *--option* argument; e.g. ```--option=3``` will give her the 3rd best.

When you do not specify the *--html* argument, a JSON file with the full list of survey options is printed to screen. [You can save it to file](samples/json/allSurveyOptions-distance.json) by simply doing:

```
> node oarunner.js --lat=51.522342 --lon=-0.083476 --distance=3 --oa=data/open_addresses_database_2014-12-10-openaddressesuk-addresses-only-split.json/ --onspd=data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK_OAoffices.csv > allSurveyOptions-distance.json
```

###The results
When saving to HTML, the output is a list of addresses suitable for surveying within the same postcode, ready for the volunteer to print and take with her.

Each address is associated to three QR codes that the user can scan to tell Open Address what the outcome of the survey was. **Note that Open Addresses is not yet ready to collect this information** and the URLs behind the QR codes are, for the time being, just stabs.

![](https://pbs.twimg.com/media/B573PoUIMAA_Qf2.jpg)

When saving to JSON, the file is an array with all identified survey options. Each survey option is made of:

- *postcode*: describing the postcode to be investigated, its lat/lon and the course's closest point, e.g.

	```
	{
		"pcd" : "HP4 2EB",
		"lat" : 51.760489,
		"lon" : -0.557384,
		"closestPoint" : {
			"distance" : 1.6,
			"position" : {
				"_lat" : 51.760688,
				"_lon" : -0.557431,
				"_radius" : 6371
			}
		}
	}
	```

- *relevantOaAddresses*: an array of all Open Addresses addresses that belong to that postcode, in their native OA JSON format.

- *inferredAddresses*: an array of all addresses inferred for that postcode, in the OA JSON format but for the elements that could not be defined (e.g., obviously, the URI associated by OA to the addresses).

The proposed postcodes are those whose centroid is within 50 yards (can be changed using the *--deviation* command line parameter) from the target distance / running course. In theory, this means that surveying the addresses won't take the volunteer too far from her planned distance or course. When specifying a course, not all points in the course are evaluated, but one every ~220 yards (the *--sample* parameter).

##Licence
Northing/Easting to Latitude/Longitude conversion in JavaScript code is done using Chris Veness' libraries, available at [http://www.movable-type.co.uk/scripts/latlong-gridref.html](http://www.movable-type.co.uk/scripts/latlong-gridref.html) and included in this repository for convenience. The libraries are licensed under CC-BY 3.0 and implement the algorithms described by Ordnance Survey in the "A guide to coordinate systems in Great Britain" document at [www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf](www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf).

The word "QR Code" is a registered trademark of DENSO WAVE INCORPORATED, see [http://www.denso-wave.com/qrcode/faqpatent-e.html](http://www.denso-wave.com/qrcode/faqpatent-e.html).

The project uses many other Open Source libraries that are referenced in the [HTML template for the survey forms](lib/html/index.html) and in the [*package.json*]([package.json]) file but not distributed within this repository.

All other code is copyright (c) 2014 Digital Contraptions Imaginarium Ltd. and licensed under the terms of the [MIT licence](LICENCE.md).
