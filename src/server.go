package main

import (
   "net/http"
   "fmt"
   "log"
   "io/ioutil"
)
const PORT string = ":8000";
func serveWeather(w http.ResponseWriter, r *http.Request){
   fmt.Println("weather");
   data,_:=ioutil.ReadFile("outfile.geojson");
   fmt.Fprint(w,string(data))
}
func servePeaks(w http.ResponseWriter, r *http.Request){
   fmt.Println("peaks");
   data,_:=ioutil.ReadFile("peaks.geojson");
   fmt.Fprint(w,string(data))
}
func serveClimbs(w http.ResponseWriter, r *http.Request){
   fmt.Println("climbs");
   data,_:=ioutil.ReadFile("climbs.geojson");
   fmt.Fprint(w,string(data))
}
func serveLayer(w http.ResponseWriter, r *http.Request){
   
}
func main() {
   fs := http.FileServer(http.Dir("public"))
   http.HandleFunc("/weather", serveWeather);
   http.HandleFunc("/peaks", servePeaks);
   http.HandleFunc("/climbs", serveClimbs);
   http.HandleFunc("/layer", serveLayer);
   http.Handle("/", fs)
   fmt.Println("Listening...");
   err := http.ListenAndServe(PORT, nil)
   if(err != nil){
      log.Println(err);
   }
}
