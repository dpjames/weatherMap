#!/bin/bash
#clean the dir
rm weather.geojson outfile outfile.geojson
python wscrub.py
python toGeoJson.py
python cleanWeather.py
ogr2ogr -f "ESRI Shapefile" -a_srs EPSG:4326 ../gis/weather/weather.shp weather.geojson
