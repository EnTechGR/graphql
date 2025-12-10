package main

import (
	"io"
	"log"
	"net/http"
	"os"
)

const (
	zoneBaseURL   = "https://platform.zone01.gr/api"
	signinPath    = "/auth/signin"
	graphqlPath   = "/graphql-engine/v1/graphql"
	defaultPort   = "8080"
	allowedOrigin = "http://localhost:5173" // change this to your frontend origin
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	// Routes
	http.HandleFunc("/health", withCORS(healthHandler))
	http.HandleFunc("/signin", withCORS(proxyHandler(zoneBaseURL+signinPath)))
	http.HandleFunc("/graphql", withCORS(proxyHandler(zoneBaseURL+graphqlPath)))

	log.Printf("Server listening on :%s\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

// Simple health check
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK"))
}

// CORS middleware
func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		// In dev you can relax this, but better to be explicit:
		if origin == "" {
			origin = allowedOrigin
		}

		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	}
}

// Generic proxy handler for a single upstream URL
func proxyHandler(targetURL string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow POST (and maybe GET later if needed)
		if r.Method != http.MethodPost {
			http.Error(w, "only POST is allowed", http.StatusMethodNotAllowed)
			return
		}

		// Create new request to Zone01
		req, err := http.NewRequest(http.MethodPost, targetURL, r.Body)
		if err != nil {
			log.Println("error creating upstream request:", err)
			http.Error(w, "failed to create upstream request", http.StatusInternalServerError)
			return
		}
		defer r.Body.Close()

		// Copy relevant headers (Authorization, Content-Type)
		if auth := r.Header.Get("Authorization"); auth != "" {
			req.Header.Set("Authorization", auth)
		}
		if ct := r.Header.Get("Content-Type"); ct != "" {
			req.Header.Set("Content-Type", ct)
		}

		// Do the request
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			log.Println("error calling upstream:", err)
			http.Error(w, "failed to contact upstream", http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		// Copy upstream headers that matter
		for k, v := range resp.Header {
			// let CORS headers from our middleware win, so avoid overwriting them
			if k == "Content-Type" {
				w.Header()[k] = v
			}
		}

		// Set status code
		w.WriteHeader(resp.StatusCode)

		// Stream body back to client
		if _, err := io.Copy(w, resp.Body); err != nil {
			log.Println("error copying response body:", err)
		}
	}
}
