oa-runner
=========

Infer addresses nearby runners' favourite courses, so that they just need to stop by and check next time

##Compatibility
- These scripts have been tested against the *.fit* files created by a [Garmin Fēnix 2 multisport watch](https://buy.garmin.com/en-GB/GB/watches-wearable-technology/wearables/fenix-2/prod159116.html). I presume that their format and conventions (e.g. the column names in the *.csv* files that can be extracted from the *.fit*) will be consistent at least across other Garmin models, but I did not test that.

##Setup
- Setup any recent Java runtime environment suitable to your system, so that it can run from the command line using the *java* command. This is required to run the *FitCSVTool* tool, part of the FIT SDK. I've done my testing using Apple MacOS' Java SE runtime environment version 1.7.0_21.
- Download the FIT SDK from [http://www.thisisant.com/resources/fit](http://www.thisisant.com/resources/fit) and uncompress it in *etc* (e.g. *etc/FitSDKRelease13.10*).
- Download the CSV edition of Office for National Statistics' "Postcode Directory" Open Data dataset from [https://geoportal.statistics.gov.uk/geoportal/catalog/content/filelist.page?redirect=Docs/PostCodes/](https://geoportal.statistics.gov.uk/geoportal/catalog/content/filelist.page?redirect=Docs/PostCodes/) and uncompress it in *data* (e.g. *data/ONSPD_NOV_2014_csv*).
- Use the *drop-terminated-postcodes.js* script to drop from the above dataset all terminated postcodes and create a new file with the remaining ones, e.g.

	```
	node tools/drop-terminated-postcodes.js --in data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK.csv --out data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK_not_terminated.csv 
	```

- Download the JSON, one-file-per-postcode-sector edition of Open Addresses UK's addresses-only dataset from [http://alpha.openaddressesuk.org/data](http://alpha.openaddressesuk.org/data) and uncompress it in *data* (e.g. *data/open_addresses_database_2014-12-10-openaddressesuk-addresses-only-split.json*).

##Run
The example below creates a JSON text file called *investigationOptions-50yards-220yards.json* including an array of the most suitable address investigation options, given the *.fit* file you provide as an input with the target course for your run. Note how the reduced version of the ONSPD dataset produced following the setup instructions above is given as an input. 

```
node main.js --fit data/fit-samples/2014-12-24-11-11-15-Navigate.fit --fitsdk etc/FitSDKRelease13.10/ --oa data/open_addresses_database_2014-12-10-openaddressesuk-addresses-only-split.json/ --onspd data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK_not_terminated.csv > investigationOptions.json 
```

Each element in the array is made of:

- *postcode*: describing the postcode to be investigated, its lat/lon and its distance along your run, e.g.

	```
	{
		"pcd" : "HP4 2EB",
		"lat" : 51.760489,
		"lon" : -0.557384,
		"courseDistance" : 1.6
	}
	```

- *relevantOaAddresses*: an array of Open Addresses addresses belonging to that postcodes, in their native OA JSON format.

The investigation options are ordered by proximity to the middle of your course. The underlying idea is that you are running to and back the address to be investigated :-) 

The proposed postcodes are those whose centroid is within 50 yards (can be changed using the *--distance* command line parameter) from the running course in the specified *.fit* file. In theory, this means that investigating the addresses won't take the runner too far from her planned course. By default, not all points in the course are used, but one every ~220 yards (the *--sample* parameter). 

##TODO
- The investigation options should not simply list the addresses that are already known to OA, but list what we're asking the runner to check! E.g. the script could do basic inference on missing PAOs and ask the runner to check if they exist for real, or confirm that they don't.
- All investigation options should be formatted in a format suitable for printing, so that the runner can take them with her. QR codes could be associated to each possible scenario being investigated, e.g. there could be one QR to say that 22 Bridge Street exists and another QR to say that it does not.

##Licence
Northing/Easting to Latitude/Longitude conversion in JavaScript code is done using Chris Veness' libraries available at [http://www.movable-type.co.uk/scripts/latlong-gridref.html](http://www.movable-type.co.uk/scripts/latlong-gridref.html) licensed under CC-BY 3.0, that implement the algorithms described by Ordnance Survey in the "A guide to coordinate systems in Great Britain" document at [www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf](www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf).
