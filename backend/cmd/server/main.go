package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type healthResponse struct {
	Status string `json:"status"`
	Port   string `json:"port"`
}

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Hello Backend 🚀")
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		err := json.NewEncoder(w).Encode(healthResponse{
			Status: "ok",
			Port:   "8080",
		})
		if err != nil {
			http.Error(w, "failed to write health response", http.StatusInternalServerError)
		}
	})

	fmt.Println("Server running on port 8080")
	fmt.Println("Home: http://localhost:8080/")
	fmt.Println("Health: http://localhost:8080/health")

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Println("Server error:", err)
	}
}
