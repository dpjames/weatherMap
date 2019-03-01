package main

import (
   "net/http"
   "fmt"
   "log"
   "io/ioutil"
)
const PORT string = ":8080";
func serverWeather(w http.ResponseWriter, r *http.Request){
   fmt.Println("weather");
   data,_:=ioutil.ReadFile("outfile.geojson");
   fmt.Fprint(w,string(data))
}
func serverPeaks(w http.ResponseWriter, r *http.Request){
   fmt.Println("peaks");
   data,_:=ioutil.ReadFile("peaks.geojson");
   fmt.Fprint(w,string(data))
}
func main() {
   fs := http.FileServer(http.Dir("public"))
   http.HandleFunc("/weather", serverWeather);
   http.HandleFunc("/peaks", serverPeaks);
   http.Handle("/", fs)
   fmt.Println("Listening...");
   err := http.ListenAndServe(PORT, nil)
   if(err != nil){
      log.Println(err);
   }
}
