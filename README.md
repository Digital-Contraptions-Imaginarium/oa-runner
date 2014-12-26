oa-runner
=========

Infer addresses nearby runners' favourite courses, so that they just need to stop by and check next time

##Setup
- Get a Java runtime environment available so that it can run from the command line using simpliy the *java* command. This is required to run the *FitCSVTool* tool, part of the FIT SDK. I've done my testing using Apple MacOS' Java SE runtime environment version 1.7.0_21.
- Download the FIT SDK from [http://www.thisisant.com/resources/fit](http://www.thisisant.com/resources/fit) and uncompress it in *etc* (e.g. *etc/FitSDKRelease13.10*).
- Download the CSV edition of Office for National Statistics' "Postcode Directory" Open Data dataset from [https://geoportal.statistics.gov.uk/geoportal/catalog/content/filelist.page?redirect=Docs/PostCodes/](https://geoportal.statistics.gov.uk/geoportal/catalog/content/filelist.page?redirect=Docs/PostCodes/) and uncompress it in *data* (e.g. *data/ONSPD_NOV_2014_csv*).
- Use the *drop-terminated-postcodes.js* script to drop from the above datasets all terminated postcodes and create a new file with the remaining ones, e.g.

```
node drop-terminated-postcodes.js --in data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK.csv --out data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK_not_terminated.csv 
```

- Download the JSON, one-file-per-postcode-sector edition of Open Addresses UK's addresses-only dataset from [http://alpha.openaddressesuk.org/data](http://alpha.openaddressesuk.org/data) and uncompress it in *data* (e.g. *data/open_addresses_database_2014-12-10-openaddressesuk-addresses-only-split.json*).

##Run
The example below creates a JSON text file called *nearby-postcodes-course.json* including an array of all postcodes whose centroid is within 0.1 miles from the running course in the specified *.fit* file. Note how the reduced version of the ONSPD dataset produced following the setup instructions above is given as an input.

```
node main.js --fit data/fit-samples/2014-12-24-11-11-15-Navigate.fit --fitsdk etc/FitSDKRelease13.10/ --onspd data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK_not_terminated.csv > nearby-postcodes-course.json
```

The distance from the course can be changed by specifying the *--distance* parameter.

## Licence
Northing/Easting to Latitude/Longitude conversion in JavaScript code is done using Chris Veness' libraries available at [http://www.movable-type.co.uk/scripts/latlong-gridref.html](http://www.movable-type.co.uk/scripts/latlong-gridref.html) licensed under CC-BY 3.0, that implement the algorithms described by Ordnance Survey in the "A guide to coordinate systems in Great Britain" document at [www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf](www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf).
