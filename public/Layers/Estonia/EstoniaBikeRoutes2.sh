#!/bin/sh
values="14 16 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39"
for i in $values; do
    echo "$i"
    sed "s/SSSS/$i[0-9]/g" OneBikeRoute.osmQ > temp1.osmQ
    wget -O temp2.osm --post-file=temp1.osmQ "http://overpass-api.de/api/interpreter"
    osmtogeojson temp2.osm > B{$i}x.geojson
    /bin/rm -f temp1.osmQ temp2.osm
done
