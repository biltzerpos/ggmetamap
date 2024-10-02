#!/bin/sh
i=1
while [ $i -le 99 ]; do
    echo "$i"
    sed "s/NNN/$i/g" OneHighway.osmQ > temp1.osmQ
    wget -O temp2.osm --post-file=temp1.osmQ "http://overpass-api.de/api/interpreter"
    osmtogeojson temp2.osm > $i.geojson
    /bin/rm -f temp1.osmQ temp2.osm
    i=$((i + 1))
done
