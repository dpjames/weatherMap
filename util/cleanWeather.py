import json
fname = "weather"

f = open("weather", "r")
txt = ""
for l in f:
    txt+=l
newFeats = []
weather = json.loads(txt)
for f in weather['features']:
    newF = f
    newF['geometry'] = f['geometry']['geometries'][0]
    newFeats.append(newF);

weather['features'] = newFeats

f = open("cleanWeather", "w+")
f.write(json.dumps(weather))
