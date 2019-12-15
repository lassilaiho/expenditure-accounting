package main

import (
	"flag"
	"log"
	"net/http"
)

func main() {
	port := flag.String("port", "8080", "port to listen to")
	flag.Parse()

	log.Print("Listening to port ", *port)
	if err := http.ListenAndServe(":"+*port, nil); err != nil {
		log.Fatal(err)
	}
}
