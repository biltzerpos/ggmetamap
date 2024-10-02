#!/bin/sh
values="1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 170"
for i in $values; do
    echo "$i"
    sed "s/SSSS/$i/g" OneBikeRoute.osmQ > temp1.osmQ
    wget -O temp2.osm --post-file=temp1.osmQ "http://overpass-api.de/api/interpreter"
    osmtogeojson temp2.osm > B$i.geojson
    /bin/rm -f temp1.osmQ temp2.osm
done
