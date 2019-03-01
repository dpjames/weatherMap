package main

import (
   "net/http"
   "fmt"
   "log"
)
const PORT string = ":8080";
func main() {
   fs := http.FileServer(http.Dir("public"))
   http.Handle("/", fs)
   fmt.Println("Listening...");
   err := http.ListenAndServe(PORT, nil)
   if(err != nil){
      log.Println(err);
   }
}
