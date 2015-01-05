##Setup
- If you want to use *.fit* files:
- Setup any recent Java runtime environment suitable to your system, so that it can run from the command line using the *java* command. This is required to run the *FitCSVTool* tool, part of the FIT SDK. We did our testing using Apple MacOS' Java SE runtime environment version 1.7.0_21.  
- Download the FIT SDK from [http://www.thisisant.com/resources/fit](http://www.thisisant.com/resources/fit) and uncompress it in *etc* (e.g. *etc/FitSDKRelease13.10*).
- Install all Node.js dependencies:

```
npm install
```
- Download the latest CSV edition of Office for National Statistics' "Postcode Directory" Open Data dataset from [https://geoportal.statistics.gov.uk/geoportal/catalog/content/filelist.page?redirect=Docs/PostCodes/](https://geoportal.statistics.gov.uk/geoportal/catalog/content/filelist.page?redirect=Docs/PostCodes/) and uncompress it in *data* (e.g. *data/ONSPD_NOV_2014_csv*).
- Use the *tools/drop-terminated-postcodes.js* script to drop from the above dataset all terminated postcodes and create a new file with the remaining ones, e.g.

```
node tools/drop-terminated-postcodes.js --in data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK.csv --out data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK_not_terminated.csv
```

This process also saves to the output file the coordinates of the postcodes' centroids in the more convenient latitude / longitude format rather than ONS' northing and easting.

Optionally, you can also drop all those postcodes that are too far away from your location to be interesting to you, e.g., in the example below, anything beyond 30 miles *as the crow flies* from the Open Addresses offices in London. This will dramatically speed up the scripts:

```
node tools/drop-terminated-postcodes.js --lat=51.522342 --lon=-0.083476 --limit=30 --in=data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK.csv --out=data/ONSPD_NOV_2014_csv/Data/ONSPD_NOV_2014_UK_OAoffices.csv
```

Don't worry if you don't know your starting point, [read here](/docs/where-am-i.md).

- Download the JSON, one-file-per-postcode-sector edition of Open Addresses UK's addresses-only dataset from [http://alpha.openaddressesuk.org/data](http://alpha.openaddressesuk.org/data) and uncompress it in *data* (e.g. *data/open_addresses_database_2014-12-10-openaddressesuk-addresses-only-split.json*).

##Compatibility
- If you want to use *oa-runner* by specifying a favourite running course and you own a fitness device / watch, at the moment we support *.fit* files only. Testing was done using files created by a [Garmin Fēnix 2 multisport watch](https://buy.garmin.com/en-GB/GB/watches-wearable-technology/wearables/fenix-2/prod159116.html). We presume that their format and conventions (e.g. the column names in the *.csv* files that can be extracted from the *.fit*) will be consistent at least across other Garmin models, but did not test that yet. Do you own any other fitness device that uses the *.fit* format? Please offer your help in the [issues section](https://github.com/Digital-Contraptions-Imaginarium/oa-runner/issues).
