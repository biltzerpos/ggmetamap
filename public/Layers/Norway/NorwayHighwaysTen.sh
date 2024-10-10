#!/bin/sh
values="0 1 2 3 4 5 6 7 8 9"
for i in $values; do
    echo "$i"
    sed "s/SSSS/$i/g" TenHighways.osmQ > temp1.osmQ
    wget -O temp2.osm --post-file=temp1.osmQ "http://overpass-api.de/api/interpreter"
    osmtogeojson temp2.osm > H8$i.geojson
    /bin/rm -f temp1.osmQ temp2.osm
done
