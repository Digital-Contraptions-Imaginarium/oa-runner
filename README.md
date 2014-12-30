oa-runner
=========

oa-runner is a collection of scripts to support runners and ramblers who want to contribute to [Open Addresses UK](http://openaddressesuk.org) by surveying addresses that are located at a given distance or nearby their planned courses.

**NOTE: this is a working prototype only**, but you are very welcome to feedback and contribute. Please use this repository's [issues section](https://github.com/Digital-Contraptions-Imaginarium/oa-runner/issues).

##Setup
- Setup any recent Java runtime environment suitable to your system, so that it can run from the command line using the *java* command. This is required to run the *FitCSVTool* tool, part of the FIT SDK. We did our testing using Apple MacOS' Java SE runtime environment version 1.7.0_21.
- Install the [PhantomJS](http://phantomjs.org/) command line utility. On MacOS, using [Homebrew](http://brew.sh/), it's as simple as:

	```
	brew install phantomjs
	```

- If you want to use *.fit* files, download the FIT SDK from [http://www.thisisant.com/resources/fit](http://www.thisisant.com/resources/fit) and uncompress it in *etc* (e.g. *etc/FitSDKRelease13.10*).
- Download the latest CSV edition of Office for National Statistics' "Postcode Directory" Open Data dataset from [https://geoportal.statistics.gov.uk/geoportal/catalog/content/filelist.page?redirect=Docs/PostCodes/](https://geoportal.statistics.gov.uk/geoportal/catalog/content/filelist.page?redirect=Docs/PostCodes/) and uncompress it in *data* (e.g. *data/ONSPD_NOV_2014_csv*).
- Use the *tools/drop-terminated-postcodes.js* script to drop from the above dataset all terminated postcodes and create a new file with the remaining ones, e.g.

	```
	node tools/drop-terminated-postcodes.js --in data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK.csv --out data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK_not_terminated.csv 
	```

- Download the JSON, one-file-per-postcode-sector edition of Open Addresses UK's addresses-only dataset from [http://alpha.openaddressesuk.org/data](http://alpha.openaddressesuk.org/data) and uncompress it in *data* (e.g. *data/open_addresses_database_2014-12-10-openaddressesuk-addresses-only-split.json*).
- Install all Node.js dependencies:

	```
	npm install 
	```

##Run
###If you don't have a favourite course
The example below creates a JSON file called *investigationOptions.json* that includes a list of address surveying options that are about 3 miles (to and back) from the Open Addresses offices in London. 

Don't worry if you don't know your starting point, [read here](/docs/where-am-i.md). 

Note how the reduced version of the ONSPD dataset produced following the setup instructions above is given as an input.

```
> node oarunner.js --lat=51.522342 --lon=-0.083476 --distance=3 --oa=data/open_addresses_database_2014-12-10-openaddressesuk-addresses-only-split.json/ --onspd=data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK_not_terminated.csv > investigationOptions.json
```

###If you have a favourite course
If you own a fitness device that can save your activity data to *.fit* format, the example below creates a JSON file called *investigationOptions-fit.json* that includes a list of address surveying options that are most suitable to the course specified in the *.fit* file provided as an input. 

```
> node oarunner.js --fit=data/fit-samples/2014-12-24-11-11-15-Navigate.fit --fitsdk=etc/FitSDKRelease13.10/ --oa=data/open_addresses_database_2014-12-10-openaddressesuk-addresses-only-split.json/ --onspd=data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK_not_terminated.csv > investigationOptions-fit.json 
```

###The results
The results file is a list of postcodes suitable for surveying, in JSON format. Don't worry, I am working already at making the same into a human-readable PDF file, ready for the volunteer to print and take with her. 

<blockquote class="twitter-tweet" lang="en"><p>Would you take oa-runner out for a spin and contribute to <a href="https://twitter.com/openaddressesuk">@openaddressesuk</a> ? <a href="http://t.co/dEYhFtMxGZ">http://t.co/dEYhFtMxGZ</a> <a href="https://twitter.com/hashtag/OpenData?src=hash">#OpenData</a> <a href="http://t.co/iCrHH9CUkS">pic.twitter.com/iCrHH9CUkS</a></p>&mdash; Gianfranco Cecconi (@giacecco) <a href="https://twitter.com/giacecco/status/549148052754530304">December 28, 2014</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

Each postcode is described by:

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

- *inferredAddresses*: an array of all addresses inferred for that postcode, in the OA JSON format but for the elements that could not be determined (e.g. obviously the URI associated by OA to addresses).

When specifying a course, the investigation options are ordered by proximity to the middle of that course. The underlying idea is that the volunteer's mission is to get to and back from the address to be surveyed :-) 

The proposed postcodes are those whose centroid is within 50 yards (can be changed using the *--deviation* command line parameter) from the target distance / running course. In theory, this means that surveying the addresses won't take the volunteer too far from her planned distance or course. When specifying a course, not all points in the course are evaluated, but one every ~220 yards (the *--sample* parameter). 

##Compatibility
- If you want to use *oa-runner* by specifying a favourite running course and you own a fitness device / watch, at the moment we support *.fit* files only. Testing was done using files created by a [Garmin Fēnix 2 multisport watch](https://buy.garmin.com/en-GB/GB/watches-wearable-technology/wearables/fenix-2/prod159116.html). We presume that their format and conventions (e.g. the column names in the *.csv* files that can be extracted from the *.fit*) will be consistent at least across other Garmin models, but did not test that yet. Do you own any other fitness device that uses the *.fit* format? Please offer your help in the [issues section](https://github.com/Digital-Contraptions-Imaginarium/oa-runner/issues).

##TODO
- All investigation options should be formatted in a format suitable for printing, so that the runner can take them with her. QR codes could be associated to each possible scenario being investigated, e.g. there could be one QR to say that 22 Bridge Street exists and another QR to say that it does not.

##Licence
Northing/Easting to Latitude/Longitude conversion in JavaScript code is done using Chris Veness' libraries, available at [http://www.movable-type.co.uk/scripts/latlong-gridref.html](http://www.movable-type.co.uk/scripts/latlong-gridref.html) and included in this repository for convenience. The libraries are licensed under CC-BY 3.0 and implement the algorithms described by Ordnance Survey in the "A guide to coordinate systems in Great Britain" document at [www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf](www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf).

QR codes are generated using Shim Sangmin's *qrcode.js* library, available at [https://github.com/davidshimjs/qrcodejs](https://github.com/davidshimjs/qrcodejs) and included in this repository for convenience. It is copyright (c) Shim Sangmin (davidshimjs) and licensed under the terms of the MIT licence.

The project uses many other Open Source libraries that are referenced in the [*package.json*]([package.json]) file but not distributed within this repository.

All other code is copyright (c) 2014 Digital Contraptions Imaginarium Ltd. and licensed under the terms of the [MIT licence](LICENCE.md).
