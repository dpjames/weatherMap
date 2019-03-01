let DAY = 0;
function getColorForDescription(desc){
   desc = desc.toLowerCase()
   if(desc.indexOf("snow") > -1){
      return "rgba(0,0,255,.5)";
   } else if(desc.indexOf("rain") > -1){
      return "rgba(0,255,0,.5)";
   } else if(desc.indexOf("sun") > -1){
      return "rgba(255,255,0,.5)";
   } else if(desc.indexOf("cloud") > -1){
      return "rgba(100,100,100,.5)";
   } else if(desc.indexOf("clear") > -1){
      return "rgba(0,0,0,0)";
   }
   console.log(desc);
   return "red";
}
function weatherStyle(f) {
   const times = f.getProperties().periods;
   const weatherColor = getColorForDescription(times[DAY].shortForecast);
   return new ol.style.Style({
      stroke : new ol.style.Stroke({color : '#000', width:1}),
      fill : new ol.style.Fill({color : weatherColor}),
   });
}
function climbStyle(f){
   return new ol.style.Style({
      image : new ol.style.Circle({
         fill : new ol.style.Fill({color : "cyan"}),
         stroke : new ol.style.Stroke({color : "black", width : "2"}),
         radius : 8
      })
   });
}
function createClimbLayer(){
   const src = new ol.source.Vector({
      url:"/climbs",
      format: new ol.format.GeoJSON(),
   });
   const climbLayer = new ol.layer.Vector({
      title:"climbs",
      source:src,
      style : climbStyle()
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
      style : weatherStyle
   });
   return weatherlayer;
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
   const weatherLayer = createWeatherLayer();
   const climbLayer = createClimbLayer();
   const baseLayer = createTopoLayer();
   mapel.innerHTML = "";
   const layers = [
      baseLayer,
      weatherLayer,
      climbLayer
      //initPeaksLayer()
   ];
   const view = new ol.View({
      center : ol.proj.fromLonLat([-122.44, 40.25]),
      zoom: 5
   });
   let map = new ol.Map({
      target:"map",
      layers:layers,
      view:view,
   });
   mapel.map = map;
   setTimeout(()=>scaleLayer(weatherLayer.getSource(), 12), 3000);

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
function moveDate(delta){
   const map = document.getElementById("map").map;
   DAY+=delta;
   DAY = DAY < 0 ? 0 : DAY;
   DAY = DAY > 13 ? 13 : DAY;
   getLayerByName(map, "weather").getSource().refresh()
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

function initPeaksLayer(){
   const src = new ol.source.Vector({
      format: new ol.format.GeoJSON(),
      url:"/peaks",
      strategy: ol.loadingstrategy.bbox});
   const clusterSrc = new ol.source.Cluster({
      distance: 100,
      source: src});
   let peaksLayer = new ol.layer.Vector({
      title: "peaks layer",
      source: clusterSrc,
      style: peaksStyleFunction});
   return peaksLayer;
}

window.onload = initMap;
