let DAY = 0;
let climbLayer = createClimbLayer();
let baseLayer = createTopoLayer();
let weatherLayer = createWeatherLayer();
let peaksLayer = createPeaksLayer();
let map = undefined;
function getColorForDescription(desc){
   desc = desc.toLowerCase()
   if(desc.indexOf("snow") > -1 ||
      desc.indexOf("frost") > -1){
      return "rgba(0,0,255,.5)";
   } else if(desc.indexOf("shower") > -1 ||
             desc.indexOf("rain") > -1 || 
             desc.indexOf("storm") > -1){
      return "rgba(0,255,0,.5)";
   } else if(desc.indexOf("sun") > -1){
      return "rgba(255,255,0,.5)";
   } else if(desc.indexOf("cloud") > -1 ||
             desc.indexOf("fog") > -1){
      return "rgba(100,100,100,.5)";
   } else if(desc.indexOf("clear") > -1){
      return "rgba(0,0,0,0)";
   } else if(desc.indexOf("loading") > -1){
      return "rgba(0,0,0,1)";
   }
   console.log(desc);
   return "red";
}
let staticWeatherStyle = new ol.style.Style({
   image : new ol.style.Circle({
      fill : new ol.style.Fill({color : "blue"}),
      stroke : new ol.style.Stroke({color : "black", width : "2"}),
      radius : 15
   })
});


function weatherStyle(f) {
   const props = f.getProperties();
   const weatherColor = getColorForDescription(props['sfc' + DAY]);
   staticWeatherStyle.getImage().getFill().setColor(weatherColor);
   staticWeatherStyle.setImage(staticWeatherStyle.getImage().clone());
   return staticWeatherStyle;
}
function getIntersectingDescription(f){
   const c = f.getGeometry().getCoordinates();
   const w = weatherLayer.getSource().getClosestFeatureToCoordinate(c); 
   if(w == null){
      return "loading";
   }
   return w.getProperties()['sfc' + DAY]
}
let staticClimbStyle = new ol.style.Style({
   image : new ol.style.Circle({
      fill : new ol.style.Fill({color : "blue"}),
      stroke : new ol.style.Stroke({color : "black", width : "2"}),
      radius : 8
   })
});

function climbStyle(f){
   let desc = getIntersectingDescription(f);
   staticClimbStyle.getImage().getFill().setColor(getColorForDescription(desc));
   staticClimbStyle.setImage(staticClimbStyle.getImage().clone());
   return staticClimbStyle
}
function createClimbLayer(){
   const src = new ol.source.Vector({
      url:function(extent){
         return "/geoserver/climbing/climbs/wfs?service=WFS&version=1.1&typename=climbs&request=GetFeature&outputFormat=application/json&srsname=EPSG:3857&bbox="
            +extent.join(",")+",EPSG:3857";
      },
      format: new ol.format.GeoJSON(),
      strategy: ol.loadingstrategy.bbox
   });
   const climbLayer = new ol.layer.Vector({
      title:"climbs",
      source:src,
      style : climbStyle
   });
   return climbLayer;
}
function createWeatherLayer(){
   const src = new ol.source.Vector({
      url:function(extent){
         bufferX = Math.abs(extent[0] - extent[2])/4;
         bufferY = Math.abs(extent[1] - extent[3])/4;
         extent[0]-=bufferX
         extent[1]-=bufferY 
         extent[2]+=bufferX
         extent[3]+=bufferY 
         return "/geoserver/climbing/weather/wfs?service=WFS&version=1.1&typename=weather&request=GetFeature&outputFormat=application/json&srsname=EPSG:3857&bbox="
            +extent.join(",")+",EPSG:3857";
      },
      format: new ol.format.GeoJSON(),
      strategy: ol.loadingstrategy.bbox
   });
   //maybe cluster
   const weatherlayer = new ol.layer.Vector({
      title:"weather",
      source:src,
      style : nostyle
   });
   return weatherlayer;
}
function nostyle(f){
   return undefined;
}
function createTopoLayer(){
   return new ol.layer.Tile({
       title: 'OSM',
       type: 'base',
       visible: true,
       source: new ol.source.XYZ({
           url: '//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
           //url: '//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png'
           //url: 'http://c.tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png'
           //url: 'http://c.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg'
           //url: 'http://tile.thunderforest.com/landscape/{z}/{x}/{y}.png'
       })
   });   
}
function initMap(){
   const mapel = document.getElementById("map");
   mapel.innerHTML = "";
   const layers = [
      baseLayer,
      weatherLayer,
      climbLayer,
   ];
   const view = new ol.View({
      center : ol.proj.fromLonLat([-122.44, 40.25]),
      zoom: 8
   });
    map = new ol.Map({
      target:"map",
      layers:layers,
      view:view,
   });
   //setTimeout(()=>scaleLayer(weatherLayer.getSource(), 12), 3000);
   //map.once('postrender', ()=>moveDate(-1));
   
}
function scaleLayer(src, factor){
   src.getFeatures().forEach(f => {
      let geo = f.getGeometry()
      if(geo.getGeometries != undefined){
         geo = geo.getGeometries()[1];
      }
      geo.scale(factor);
      f.setGeometry(geo);
   });
}
function getLayerByName(map, lname){
   let layer;
   map.getLayers().forEach((l) => {
      if(l.get("title") === lname){
         layer = l;
      }
   });
   return layer;
}
const days = ["SUNDAY", "MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
function moveDate(delta){
   DAY+=delta;
   DAY = DAY < 0 ? 0 : DAY;
   DAY = DAY > 13 ? 13 : DAY;
   const times = weatherLayer.getSource().getFeatures()[0].getProperties();
   daystr = times['name'+DAY];
   document.getElementById("curTimeDisplay").innerHTML = "Weather Forecast for " + daystr;
   map.getLayers().forEach(l => l.get('title') != "OSM" ? l.getSource().refresh() : undefined);
}


function peaksStyleFunction(feature){
   const num = feature.get("features").length; 
      let image = null;
      let theText = "";
      if(num === 1){
         image = new ol.style.RegularShape({
            points:3,
            radius:20,
            angle:Math.PI/3,
            rotation:Math.PI,
            fill:new ol.style.Fill({color:"black"}),
            stroke: new ol.style.Stroke({color:"red",width:1 })});
      } else {
         theText = num.toString();
         image = new ol.style.Circle({
            radius:20,
            fill:new ol.style.Fill({color:"black"}),
            stroke: new ol.style.Stroke({color:"red",width:1 })});
      }
      let text = new ol.style.Text({
         scale:1.3,
         text: theText,
         fill: new ol.style.Fill({color:"white"}),
         stroke: new ol.style.Stroke({color:"black", width:5}),});
      return [new ol.style.Style({text:text, image:image})];
}

function createPeaksLayer(){
   const src = new ol.source.Vector({
      format: new ol.format.GeoJSON(),
      url:function(extent){
         return "/geoserver/climbing/peaks/wfs?service=WFS&version=1.1&typename=peaks&request=GetFeature&outputFormat=application/json&srsname=EPSG:3857&bbox="
            +extent.join(",")+",EPSG:3857";
      },
      strategy: ol.loadingstrategy.bbox});
   let peaksLayer = new ol.layer.Vector({
      title: "peaks layer",
      source: src,
      style: climbStyle
   });
   return peaksLayer;
}
function toggleOnOff(el){
   const on = el.classList.contains("on");
   el.classList.remove(on ? "on" : "off");
   el.classList.add(on ? "off" : "on");
   return on;
}
function toggleLayer(l, el){
   let on = toggleOnOff(el);
   on ? map.removeLayer(l) : map.addLayer(l);
}
function toggleWeather(el){
   let on = toggleOnOff(el);
   on ? weatherLayer.setStyle(nostyle) : weatherLayer.setStyle(weatherStyle);
}
window.onload = initMap;
