#!/bin/sh

echo "["

awk '
  /<node / {
    gsub(/.*lat="/, "", $0);
    gsub(/" lon="/, " ", $0);
    gsub(/".*/, "", $0);
    split($0, coords, " ");
    if (coords[1] && coords[2]) {
      printf "  [ %s, %s ],\n", coords[2], coords[1];
    }
  }
' 

echo "]"
