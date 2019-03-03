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
    del newF['@context']
    fp = f['properties']
    for i in range(len(fp['periods'])):
        cp = fp['periods'][i]
        newF['properties']['isDaytime' + str(i)] = cp['isDaytime']
        newF['properties']['name' + str(i)] = cp['name']
        newF['properties']['shortForecast' + str(i)] = cp['shortForecast']
        newF['properties']['startTime' + str(i)] = cp['startTime']
    newFeats.append(newF);

weather['features'] = newFeats

f = open("cleanWeather", "w+")
f.write(json.dumps(weather))
