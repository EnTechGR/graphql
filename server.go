package main

import (
	"io"
	"log"
	"net/http"
	"os"
)

const (
	zoneBaseURL = "https://platform.zone01.gr/api"

	signinPath  = "/auth/signin"
	graphqlPath = "/graphql-engine/v1/graphql"

	defaultPort = "8080"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	mux := http.NewServeMux()

	// API routes (with CORS)
	mux.HandleFunc("/signin", withCORS(proxyHandler(zoneBaseURL+signinPath)))
	mux.HandleFunc("/graphql", withCORS(proxyHandler(zoneBaseURL+graphqlPath)))
	mux.HandleFunc("/health", withCORS(healthHandler))

	// Static file server for the frontend (docs folder)
	fs := http.FileServer(http.Dir("./docs"))
	// This will serve index.html at "/", profile.html at "/profile.html", etc.
	mux.Handle("/", fs)

	log.Printf("Server listening on :%s\n", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK"))
}

// CORS only matters for the API routes, not static files
func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "http://localhost:8080"
		}

		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	}
}

func proxyHandler(targetURL string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "only POST is allowed", http.StatusMethodNotAllowed)
			return
		}

		req, err := http.NewRequest(http.MethodPost, targetURL, r.Body)
		if err != nil {
			log.Println("error creating upstream request:", err)
			http.Error(w, "failed to create upstream request", http.StatusInternalServerError)
			return
		}
		defer r.Body.Close()

		if auth := r.Header.Get("Authorization"); auth != "" {
			req.Header.Set("Authorization", auth)
		}
		if ct := r.Header.Get("Content-Type"); ct != "" {
			req.Header.Set("Content-Type", ct)
		}

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			log.Println("error calling upstream:", err)
			http.Error(w, "failed to contact upstream", http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		if ct := resp.Header.Get("Content-Type"); ct != "" {
			w.Header().Set("Content-Type", ct)
		}

		w.WriteHeader(resp.StatusCode)
		if _, err := io.Copy(w, resp.Body); err != nil {
			log.Println("error copying response body:", err)
		}
	}
}
