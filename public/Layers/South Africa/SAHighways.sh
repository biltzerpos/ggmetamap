#!/bin/sh
#/bin/rm -f MexRes.txt
i=800
while [ $i -le 999 ]; do
    echo "$i"
    sed "s/NNN/$i/g" OneHighway.osmQ > temp1.osmQ
    wget -O temp2.osm --post-file=temp1.osmQ "http://overpass-api.de/api/interpreter"
    osmtogeojson temp2.osm > R$i.geojson
    /bin/rm -f temp1.osmQ temp2.osm
    i=$((i + 1))
done
exit
while [ $# -ge 1 ]
do
  echo Getting data from $1
  cat "$1" | while read line 
  do
    # do something with $line here
    city=`printf "$line" | cut -f1`
    state=`printf "$line" | cut -f2`
    code=`printf "$line" | cut -f3`
    # printf "$city\n"
    # printf "$state\n"
    # printf "$code\n"
    sed "s/SSSSSSSS/$state/g" OneCity.osmQ > temp1.osmQ
    sed "s/CCCCCCCC/$city/g" temp1.osmQ > temp2.osmQ
    wget -O temp3.osm --post-file=temp2.osmQ "http://overpass-api.de/api/interpreter"
    grep 'node.*lat=.*lon=' temp3.osm
    if [ $? -eq 0 ]
    then
      echo "---"
      echo "$city $state" >> MexRes.txt
      grep 'node.*lat=.*lon=' temp3.osm | cut -d'"' -f4 >> MexRes.txt
      grep 'node.*lat=.*lon=' temp3.osm | cut -d'"' -f6 >> MexRes.txt
      echo "$code" >> MexRes.txt
    fi
    # osmtogeojson $1.osm > $1.geojson
    /bin/rm -f temp1.osmQ temp2.osmQ temp3.osm
  done
  shift
done
