#!/bin/sh
values="A40 A41 A42 A46 A47 A48 A49 A5 A50 A51 A52 A53 A54 A55 B42 B43 B44 B45 B46 B48 B5 B50 B51 B53 B54"
values="B5"
for i in $values; do
    echo "$i"
    sed "s/SSSS/$i/g" HighwaySet.osmQ > temp1.osmQ
    cat temp1.osmQ
    wget -O temp2.osm --post-file=temp1.osmQ "http://overpass-api.de/api/interpreter"
    #curl -X POST -d @temp1.osmQ "http://overpass-api.de/api/interpreter" -o temp2.osm
    osmtogeojson temp2.osm > $i.geojson
    /bin/rm -f temp1.osmQ temp2.osm
done
