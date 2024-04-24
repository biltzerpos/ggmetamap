#!/bin/sh
i=0
while [ $i -le 9 ]; do
    echo "$i"
    sed "s/NNN/00$i/g" OneHighway.osmQ > temp1.osmQ
    wget -O temp2.osm --post-file=temp1.osmQ "http://overpass-api.de/api/interpreter"
    osmtogeojson temp2.osm > D00$i.geojson
    /bin/rm -f temp1.osmQ temp2.osm
    i=$((i + 1))
done
