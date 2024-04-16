#!/bin/sh
for i in 2 3 4 5 6 7 8 9
do
  node mex.js MexRes"$i"00.txt
  mv -f markers.json "/Users/bil/Dropbox/GG/GGMetaMap/public/Layers/Mexico/Phone Codes"$i"00.json"
  mv -f areas.geojson "/Users/bil/Dropbox/GG/GGMetaMap/public/Layers/Mexico/Phone Codes"$i"00.geojson"
done 
