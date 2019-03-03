let DAY = 0;
let climbLayer = createClimbLayer();
let baseLayer = createTopoLayer();
let weatherLayer = createWeatherLayer();
let peaksLayer = createPeaksLayer();
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
      stroke : new ol.style.Stroke({color : '#000', width:1}),
      fill : new ol.style.Fill({color : "red"}),
   });
function weatherStyle(f) {
   const times = f.getProperties().periods;
   const weatherColor = getColorForDescription(times[DAY].shortForecast);
   staticWeatherStyle.getFill().setColor(weatherColor);
   return staticWeatherStyle;
}
function getIntersectingDescription(f){
   const c = f.getGeometry().getCoordinates();
   const w = weatherLayer.getSource().getClosestFeatureToCoordinate(c); 
   if(w == null){
      return "loading";
   }
   return w.getProperties().periods[DAY].shortForecast 
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
      url:"/weather",
      format: new ol.format.GeoJSON(),
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
      peaksLayer
   ];
   const view = new ol.View({
      center : ol.proj.fromLonLat([-122.44, 40.25]),
      zoom: 8
   });
   let map = new ol.Map({
      target:"map",
      layers:layers,
      view:view,
   });
   mapel.map = map;
   //setTimeout(()=>scaleLayer(weatherLayer.getSource(), 12), 3000);
   
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
   const map = document.getElementById("map").map;
   DAY+=delta;
   DAY = DAY < 0 ? 0 : DAY;
   DAY = DAY > 13 ? 13 : DAY;
   const times = weatherLayer.getSource().getFeatures()[0].getProperties().periods;
   daystr = days[(new Date(times[DAY].startTime)).getDay()]
   if(times[DAY].isDaytime){
      daystr += " DAY";
   } else {
      daystr += " NIGHT";
   }
   document.getElementById("curTimeDisplay").innerHTML = daystr
   document.getElementById("map").map.getLayers().forEach(l => l.get('title') != "OSM" ? l.getSource().refresh() : undefined);
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
function toggleLayer(l, el){
   const active = el.getAttribute("data-active");
   el.setAttribute("data-active", active == "true" ? "false" : "true");
   const map = document.getElementById("map").map;
   active == "true" ? map.removeLayer(l) : map.addLayer(l);
}
function toggleWeather(el){
   const active = el.getAttribute("data-active");
   el.setAttribute("data-active", active == "true" ? "false" : "true");
   active == "true" ? weatherLayer.setStyle(nostyle) : weatherLayer.setStyle(weatherStyle);
}
window.onload = initMap;
