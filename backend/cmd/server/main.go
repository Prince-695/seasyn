package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type healthResponse struct {
	Status string `json:"status"`
	Port   string `json:"port"`
}

func main() {
	// ✅ Get PORT from environment (IMPORTANT)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // fallback for local
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Hello Backend 🚀")
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		err := json.NewEncoder(w).Encode(healthResponse{
			Status: "ok",
			Port:   port, // ✅ dynamic port
		})
		if err != nil {
			http.Error(w, "failed to write health response", http.StatusInternalServerError)
		}
	})

	fmt.Println("Server running on port", port)
	fmt.Printf("Home: http://localhost:%s/\n", port)
	fmt.Printf("Health: http://localhost:%s/health\n", port)

	// ✅ Use dynamic port
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		fmt.Println("Server error:", err)
	}
}
