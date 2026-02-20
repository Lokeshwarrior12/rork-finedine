package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte("<h1>PrimeDine Backend Running ✅</h1>"))
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"primedine"}`))
	})

	http.HandleFunc("/api/v1/restaurants", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{
			"data": [{
				"id": "1",
				"name": "The Italian Corner",
				"description": "Authentic Italian cuisine",
				"cuisineType": "Italian",
				"city": "New York",
				"rating": 4.7,
				"priceRange": "$$",
				"isActive": true
			}]
		}`))
	})

	log.Printf("🚀 Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
